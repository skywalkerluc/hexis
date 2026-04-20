import type { RecommendationKind } from "@prisma/client";
import { addDays, fullDaysBetween } from "@/modules/decay/domain/time";
import { prismaClient } from "@/shared/db/prisma-client";
import { decimalToNumber, roundScore } from "@/shared/kernel/decimal";
import { RECOMMENDATION_EXPIRY_DAYS } from "@/shared/kernel/scoring.constants";
import { scoreRecommendationCandidate } from "@/modules/recommendations/domain/recommendation-scoring";
import {
  APPLIED_REACTIVATION_DAYS,
  DISMISSED_REACTIVATION_DAYS,
  REACTIVATION_PRIORITY_THRESHOLD,
} from "@/modules/recommendations/domain/recommendation-lifecycle.constants";

const MAX_RECOMMENDATIONS = 4;
const RECOMMENDATION_THRESHOLD = 0.2;
const MAINTENANCE_KIND: RecommendationKind = "MAINTENANCE_BLOCK";

export type GenerateRecommendationsInput = {
  userId: string;
  now: Date;
};

type RecommendationCandidate = {
  attributeDefinitionId: string;
  attributeName: string;
  score: number;
  deficit: number;
  daysSinceEvent: number;
};

function shouldReactivateDismissed(
  dismissedAt: Date | null,
  candidateScore: number,
  now: Date,
): boolean {
  const reactivationAt = dismissedAt
    ? addDays(dismissedAt, DISMISSED_REACTIVATION_DAYS)
    : now;
  return (
    now.getTime() >= reactivationAt.getTime() &&
    candidateScore >= REACTIVATION_PRIORITY_THRESHOLD
  );
}

function shouldReactivateApplied(
  appliedAt: Date | null,
  candidateScore: number,
  now: Date,
): boolean {
  const reactivationAt = appliedAt
    ? addDays(appliedAt, APPLIED_REACTIVATION_DAYS)
    : now;
  return (
    now.getTime() >= reactivationAt.getTime() &&
    candidateScore >= REACTIVATION_PRIORITY_THRESHOLD
  );
}

function buildCandidateList(
  input: GenerateRecommendationsInput,
  attributes: {
    status: string;
    currentValue: { toNumber(): number };
    baseValue: { toNumber(): number };
    potentialValue: { toNumber(): number };
    lastEventAt: Date | null;
    createdAt: Date;
    attributeDefinitionId: string;
    attributeDefinition: { name: string };
  }[],
): RecommendationCandidate[] {
  return attributes
    .map((attribute) => {
      const current = decimalToNumber(attribute.currentValue);
      const base = decimalToNumber(attribute.baseValue);
      const potential = decimalToNumber(attribute.potentialValue);
      const daysSinceEvent = fullDaysBetween(
        attribute.lastEventAt ?? attribute.createdAt,
        input.now,
      );

      const score = scoreRecommendationCandidate({
        status: attribute.status,
        currentValue: current,
        baseValue: base,
        potentialValue: potential,
        daysSinceEvent,
      });

      return {
        attributeDefinitionId: attribute.attributeDefinitionId,
        attributeName: attribute.attributeDefinition.name,
        score: score.score,
        deficit: score.deficit,
        daysSinceEvent,
      };
    })
    .filter((candidate) => candidate.score > RECOMMENDATION_THRESHOLD)
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_RECOMMENDATIONS);
}

export async function generateRecommendationsForUser(
  input: GenerateRecommendationsInput,
): Promise<number> {
  const attributes = await prismaClient.userAttribute.findMany({
    where: { userId: input.userId },
    include: {
      attributeDefinition: true,
    },
  });

  const candidates = buildCandidateList(input, attributes);

  await prismaClient.recommendation.updateMany({
    where: {
      userId: input.userId,
      status: "ACTIVE",
      expiresAt: { lt: input.now },
    },
    data: {
      status: "EXPIRED",
      lastEvaluatedAt: input.now,
    },
  });

  const existingRecommendations = await prismaClient.recommendation.findMany({
    where: {
      userId: input.userId,
      kind: MAINTENANCE_KIND,
    },
  });

  const existingByAttribute = new Map(
    existingRecommendations.map((recommendation) => [
      recommendation.attributeDefinitionId,
      recommendation,
    ]),
  );

  const candidateByAttribute = new Map(
    candidates.map((candidate) => [candidate.attributeDefinitionId, candidate]),
  );

  for (const candidate of candidates) {
    const existing = existingByAttribute.get(candidate.attributeDefinitionId);
    const expectedCurrentGain = Math.max(0.2, roundScore(candidate.deficit * 0.4));

    if (!existing) {
      await prismaClient.recommendation.create({
        data: {
          userId: input.userId,
          attributeDefinitionId: candidate.attributeDefinitionId,
          kind: MAINTENANCE_KIND,
          title: `${candidate.attributeName}: maintenance block`,
          rationale: `${candidate.daysSinceEvent} day(s) since last evidence. Current is below stable base trend.`,
          expectedCurrentGain,
          priorityScore: candidate.score,
          status: "ACTIVE",
          generatedAt: input.now,
          expiresAt: addDays(input.now, RECOMMENDATION_EXPIRY_DAYS),
          lastEvaluatedAt: input.now,
        },
      });
      continue;
    }

    if (
      existing.status === "DISMISSED" &&
      !shouldReactivateDismissed(existing.dismissedAt, candidate.score, input.now)
    ) {
      await prismaClient.recommendation.update({
        where: { id: existing.id },
        data: {
          priorityScore: candidate.score,
          lastEvaluatedAt: input.now,
          rationale: `${candidate.daysSinceEvent} day(s) since last evidence. Current is below stable base trend.`,
          expectedCurrentGain,
        },
      });
      continue;
    }

    if (
      existing.status === "APPLIED" &&
      !shouldReactivateApplied(existing.appliedAt, candidate.score, input.now)
    ) {
      await prismaClient.recommendation.update({
        where: { id: existing.id },
        data: {
          priorityScore: candidate.score,
          lastEvaluatedAt: input.now,
          rationale: `${candidate.daysSinceEvent} day(s) since last evidence. Current is below stable base trend.`,
          expectedCurrentGain,
        },
      });
      continue;
    }

    await prismaClient.recommendation.update({
      where: { id: existing.id },
      data: {
        status: "ACTIVE",
        title: `${candidate.attributeName}: maintenance block`,
        rationale: `${candidate.daysSinceEvent} day(s) since last evidence. Current is below stable base trend.`,
        expectedCurrentGain,
        priorityScore: candidate.score,
        generatedAt: input.now,
        expiresAt: addDays(input.now, RECOMMENDATION_EXPIRY_DAYS),
        lastEvaluatedAt: input.now,
        dismissedAt: null,
        appliedAt: null,
      },
    });
  }

  for (const existing of existingRecommendations) {
    if (candidateByAttribute.has(existing.attributeDefinitionId)) {
      continue;
    }

    if (existing.status === "ACTIVE") {
      await prismaClient.recommendation.update({
        where: { id: existing.id },
        data: {
          status: "EXPIRED",
          lastEvaluatedAt: input.now,
        },
      });
      continue;
    }

    await prismaClient.recommendation.update({
      where: { id: existing.id },
      data: {
        lastEvaluatedAt: input.now,
      },
    });
  }

  return candidates.length;
}
