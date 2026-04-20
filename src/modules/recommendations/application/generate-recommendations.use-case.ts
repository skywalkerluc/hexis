import type { RecommendationKind } from "@prisma/client";
import { addDays, fullDaysBetween } from "@/modules/decay/domain/time";
import { prismaClient } from "@/shared/db/prisma-client";
import { decimalToNumber, roundScore } from "@/shared/kernel/decimal";
import { RECOMMENDATION_EXPIRY_DAYS } from "@/shared/kernel/scoring.constants";
import { scoreRecommendationCandidate } from "@/modules/recommendations/domain/recommendation-scoring";
import { readCultivationGoal } from "@/modules/onboarding/domain/cultivation-goal";
import { buildRecommendationRationale } from "@/modules/recommendations/domain/recommendation-rationale";
import {
  APPLIED_REACTIVATION_DAYS,
  DISMISSED_REACTIVATION_DAYS,
  REACTIVATION_PRIORITY_THRESHOLD,
} from "@/modules/recommendations/domain/recommendation-lifecycle.constants";

const MAX_RECOMMENDATIONS = 4;
const RECOMMENDATION_THRESHOLD = 0.2;
const MAINTENANCE_KIND: RecommendationKind = "MAINTENANCE_BLOCK";
const GOAL_ALIGNMENT_SCORE_BONUS = 0.6;

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
  goalAligned: boolean;
  currentValue: number;
  baseValue: number;
  potentialValue: number;
  status: string;
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
  goalFocusAttributeSlugs: Set<string>,
  attributes: {
    status: string;
    currentValue: { toNumber(): number };
    baseValue: { toNumber(): number };
    potentialValue: { toNumber(): number };
    lastEventAt: Date | null;
    createdAt: Date;
    attributeDefinitionId: string;
    attributeDefinition: { name: string; slug: string };
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
      const goalAligned = goalFocusAttributeSlugs.has(attribute.attributeDefinition.slug);
      const prioritizedScore = goalAligned
        ? roundScore(score.score + GOAL_ALIGNMENT_SCORE_BONUS)
        : score.score;

      return {
        attributeDefinitionId: attribute.attributeDefinitionId,
        attributeName: attribute.attributeDefinition.name,
        score: prioritizedScore,
        deficit: score.deficit,
        daysSinceEvent,
        goalAligned,
        currentValue: current,
        baseValue: base,
        potentialValue: potential,
        status: attribute.status,
      };
    })
    .filter((candidate) => candidate.score > RECOMMENDATION_THRESHOLD)
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_RECOMMENDATIONS);
}

export async function generateRecommendationsForUser(
  input: GenerateRecommendationsInput,
): Promise<number> {
  const [attributes, onboarding] = await Promise.all([
    prismaClient.userAttribute.findMany({
      where: { userId: input.userId },
      include: {
        attributeDefinition: true,
      },
    }),
    prismaClient.userOnboarding.findUnique({
      where: { userId: input.userId },
      select: { cultivationGoal: true },
    }),
  ]);

  const goalFocusAttributeSlugs =
    onboarding?.cultivationGoal === null || onboarding?.cultivationGoal === undefined
      ? new Set<string>()
      : new Set<string>(
          readCultivationGoal(onboarding.cultivationGoal).focusAttributeSlugs,
        );
  const candidates = buildCandidateList(input, goalFocusAttributeSlugs, attributes);

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
    const rationale = buildRecommendationRationale({
      attributeName: candidate.attributeName,
      currentValue: candidate.currentValue,
      baseValue: candidate.baseValue,
      potentialValue: candidate.potentialValue,
      status: candidate.status,
      daysSinceEvent: candidate.daysSinceEvent,
      goalAligned: candidate.goalAligned,
    });

    if (!existing) {
      await prismaClient.recommendation.create({
        data: {
          userId: input.userId,
          attributeDefinitionId: candidate.attributeDefinitionId,
          kind: MAINTENANCE_KIND,
          title: `${candidate.attributeName}: maintenance block`,
          rationale,
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
          rationale,
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
          rationale,
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
        rationale,
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
