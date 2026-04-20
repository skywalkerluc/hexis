import { prismaClient } from "@/shared/db/prisma-client";
import { decimalToNumber, roundScore } from "@/shared/kernel/decimal";

const CHANGE_STABLE_THRESHOLD = 0.05;
const WEEKLY_REVIEW_DAYS = 7;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const MAX_CHANGED_ATTRIBUTE_ITEMS = 3;
const MAX_SUGGESTED_ACTIONS = 2;

export type RetentionAttributeChange = {
  userAttributeId: string;
  slug: string;
  name: string;
  status: string;
  deltaCurrent: number;
  currentValue: number;
  baseValue: number;
};

export type SinceLastVisitSummary = {
  isReturningUser: boolean;
  sinceAt: Date;
  improvedCount: number;
  declinedCount: number;
  stableCount: number;
  improved: RetentionAttributeChange[];
  declined: RetentionAttributeChange[];
  needsAttentionCount: number;
  newRecommendationCount: number;
  evidenceLoggedCount: number;
  interpretation: string;
};

export type WeeklyReviewSummary = {
  periodStart: Date;
  periodEnd: Date;
  improvedCount: number;
  declinedCount: number;
  stableCount: number;
  improved: RetentionAttributeChange[];
  declined: RetentionAttributeChange[];
  needsAttentionCount: number;
  recommendationUpdates: number;
  evidenceLoggedCount: number;
  interpretation: string;
};

export type RetentionSuggestedAction = {
  key: string;
  title: string;
  description: string;
  href: string;
  source: "return_summary" | "weekly_review";
};

export type RetentionView = {
  sinceLastVisit: SinceLastVisitSummary;
  weeklyReview: WeeklyReviewSummary;
  suggestedActions: RetentionSuggestedAction[];
};

type AttributeSnapshot = {
  id: string;
  slug: string;
  name: string;
  status: string;
  currentValue: number;
  baseValue: number;
};

type AttributeDelta = {
  userAttributeId: string;
  firstCurrent: number;
  lastCurrent: number;
};

function startOfWindow(days: number, now: Date): Date {
  return new Date(
    now.getTime() -
      days *
        HOURS_PER_DAY *
        MINUTES_PER_HOUR *
        SECONDS_PER_MINUTE *
        MILLISECONDS_PER_SECOND,
  );
}

function classifyChange(delta: number): "IMPROVED" | "DECLINED" | "STABLE" {
  if (delta > CHANGE_STABLE_THRESHOLD) {
    return "IMPROVED";
  }
  if (delta < -CHANGE_STABLE_THRESHOLD) {
    return "DECLINED";
  }
  return "STABLE";
}

function buildAttributeDeltaMap(
  logs: {
    userAttributeId: string;
    previousCurrent: { toNumber(): number };
    nextCurrent: { toNumber(): number };
  }[],
): Map<string, AttributeDelta> {
  const byAttribute = new Map<string, AttributeDelta>();

  for (const log of logs) {
    const existing = byAttribute.get(log.userAttributeId);
    const previousCurrent = decimalToNumber(log.previousCurrent);
    const nextCurrent = decimalToNumber(log.nextCurrent);

    if (!existing) {
      byAttribute.set(log.userAttributeId, {
        userAttributeId: log.userAttributeId,
        firstCurrent: previousCurrent,
        lastCurrent: nextCurrent,
      });
      continue;
    }

    byAttribute.set(log.userAttributeId, {
      ...existing,
      lastCurrent: nextCurrent,
    });
  }

  return byAttribute;
}

function buildChangeSummary(
  attributes: AttributeSnapshot[],
  deltasByAttribute: Map<string, AttributeDelta>,
): {
  improvedCount: number;
  declinedCount: number;
  stableCount: number;
  improved: RetentionAttributeChange[];
  declined: RetentionAttributeChange[];
} {
  const improved: RetentionAttributeChange[] = [];
  const declined: RetentionAttributeChange[] = [];
  let improvedCount = 0;
  let declinedCount = 0;
  let stableCount = 0;

  for (const attribute of attributes) {
    const deltaEntry = deltasByAttribute.get(attribute.id);
    const deltaCurrent = deltaEntry
      ? roundScore(deltaEntry.lastCurrent - deltaEntry.firstCurrent)
      : 0;

    const classification = classifyChange(deltaCurrent);
    const item: RetentionAttributeChange = {
      userAttributeId: attribute.id,
      slug: attribute.slug,
      name: attribute.name,
      status: attribute.status,
      deltaCurrent,
      currentValue: attribute.currentValue,
      baseValue: attribute.baseValue,
    };

    if (classification === "IMPROVED") {
      improvedCount += 1;
      improved.push(item);
      continue;
    }

    if (classification === "DECLINED") {
      declinedCount += 1;
      declined.push(item);
      continue;
    }

    stableCount += 1;
  }

  return {
    improvedCount,
    declinedCount,
    stableCount,
    improved: improved
      .sort((left, right) => right.deltaCurrent - left.deltaCurrent)
      .slice(0, MAX_CHANGED_ATTRIBUTE_ITEMS),
    declined: declined
      .sort((left, right) => left.deltaCurrent - right.deltaCurrent)
      .slice(0, MAX_CHANGED_ATTRIBUTE_ITEMS),
  };
}

function buildSuggestedActions(input: {
  topRecommendation:
    | {
        attributeDefinition: { name: string };
      }
    | undefined;
  topAttentionAttribute:
    | {
        slug: string;
        name: string;
      }
    | undefined;
}): RetentionSuggestedAction[] {
  const actions: RetentionSuggestedAction[] = [];

  if (input.topRecommendation) {
    actions.push({
      key: "weekly_focus_log_priority_recommendation",
      title: "Log one focused maintenance block",
      description: `Prioritize ${input.topRecommendation.attributeDefinition.name} while momentum is fragile.`,
      href: "/log?source=dashboard_goal",
      source: "return_summary",
    });
  }

  if (input.topAttentionAttribute) {
    actions.push({
      key: "review_attention_attribute",
      title: `Review ${input.topAttentionAttribute.name}`,
      description: "Inspect recent evidence and decay context before your next block.",
      href: `/attributes/${input.topAttentionAttribute.slug}`,
      source: "return_summary",
    });
  }

  return actions.slice(0, MAX_SUGGESTED_ACTIONS);
}

function buildChangeInterpretation(input: {
  improvedCount: number;
  declinedCount: number;
  stableCount: number;
  evidenceLoggedCount: number;
  needsAttentionCount: number;
}): string {
  if (input.declinedCount > 0 && input.evidenceLoggedCount === 0) {
    return "Some attributes are slipping through lack of reinforcement.";
  }
  if (input.declinedCount > 0 && input.improvedCount > 0) {
    return "Mixed pattern: some recovery is visible, with slippage in other areas.";
  }
  if (input.declinedCount > 0) {
    return "Recent signals suggest drift; a small maintenance block can stabilize trend.";
  }
  if (input.improvedCount > 0 && input.evidenceLoggedCount > 0) {
    return "Recent reinforcement is working; keep the same cadence to consolidate gains.";
  }
  if (input.stableCount > 0 && input.evidenceLoggedCount > 0) {
    return "State is stable because it is being maintained.";
  }
  if (input.stableCount > 0 && input.needsAttentionCount > 0) {
    return "Little changed recently, but attention is still needed in fragile attributes.";
  }
  return "Little changed recently. A focused block can restore useful momentum.";
}

export async function readRetentionView(
  userId: string,
  now: Date,
): Promise<RetentionView> {
  const weeklyStart = startOfWindow(WEEKLY_REVIEW_DAYS, now);
  const [
    dashboardViews,
    attributes,
    activeRecommendations,
    newRecommendationsSinceWeek,
    evidenceSinceWeek,
    weeklyLogs,
  ] = await Promise.all([
    prismaClient.productAnalyticsEvent.findMany({
      where: {
        userId,
        eventName: "dashboard.viewed",
      },
      orderBy: { occurredAt: "desc" },
      take: 2,
    }),
    prismaClient.userAttribute.findMany({
      where: { userId },
      include: {
        attributeDefinition: {
          select: {
            slug: true,
            name: true,
          },
        },
      },
    }),
    prismaClient.recommendation.findMany({
      where: {
        userId,
        status: "ACTIVE",
      },
      include: {
        attributeDefinition: {
          select: { name: true },
        },
      },
      orderBy: { priorityScore: "desc" },
    }),
    prismaClient.recommendation.count({
      where: {
        userId,
        generatedAt: { gte: weeklyStart },
      },
    }),
    prismaClient.evidenceEvent.count({
      where: {
        userId,
        occurredAt: { gte: weeklyStart },
      },
    }),
    prismaClient.attributeHistoryLog.findMany({
      where: {
        userId,
        changedAt: { gte: weeklyStart },
      },
      select: {
        userAttributeId: true,
        previousCurrent: true,
        nextCurrent: true,
      },
      orderBy: { changedAt: "asc" },
    }),
  ]);

  const attributeSnapshots: AttributeSnapshot[] = attributes.map((attribute) => ({
    id: attribute.id,
    slug: attribute.attributeDefinition.slug,
    name: attribute.attributeDefinition.name,
    status: attribute.status,
    currentValue: decimalToNumber(attribute.currentValue),
    baseValue: decimalToNumber(attribute.baseValue),
  }));

  const isReturningUser = dashboardViews.length > 1;
  const previousDashboardView = dashboardViews[1];
  const sinceAt =
    isReturningUser && previousDashboardView
      ? previousDashboardView.occurredAt
      : weeklyStart;

  const [sinceLogs, evidenceSinceVisit, newRecommendationsSinceVisit] = await Promise.all([
    prismaClient.attributeHistoryLog.findMany({
      where: {
        userId,
        changedAt: { gte: sinceAt },
      },
      select: {
        userAttributeId: true,
        previousCurrent: true,
        nextCurrent: true,
      },
      orderBy: { changedAt: "asc" },
    }),
    prismaClient.evidenceEvent.count({
      where: {
        userId,
        occurredAt: { gte: sinceAt },
      },
    }),
    prismaClient.recommendation.count({
      where: {
        userId,
        generatedAt: { gte: sinceAt },
      },
    }),
  ]);

  const sinceSummary = buildChangeSummary(
    attributeSnapshots,
    buildAttributeDeltaMap(sinceLogs),
  );
  const weeklySummary = buildChangeSummary(
    attributeSnapshots,
    buildAttributeDeltaMap(weeklyLogs),
  );

  const needsAttentionCount = attributeSnapshots.filter(
    (attribute) => attribute.status === "AT_RISK" || attribute.status === "DECAYING",
  ).length;
  const topAttentionAttribute = attributeSnapshots.find(
    (attribute) => attribute.status === "AT_RISK" || attribute.status === "DECAYING",
  );

  return {
    sinceLastVisit: {
      isReturningUser,
      sinceAt,
      improvedCount: sinceSummary.improvedCount,
      declinedCount: sinceSummary.declinedCount,
      stableCount: sinceSummary.stableCount,
      improved: sinceSummary.improved,
      declined: sinceSummary.declined,
      needsAttentionCount,
      newRecommendationCount: newRecommendationsSinceVisit,
      evidenceLoggedCount: evidenceSinceVisit,
      interpretation: buildChangeInterpretation({
        improvedCount: sinceSummary.improvedCount,
        declinedCount: sinceSummary.declinedCount,
        stableCount: sinceSummary.stableCount,
        evidenceLoggedCount: evidenceSinceVisit,
        needsAttentionCount,
      }),
    },
    weeklyReview: {
      periodStart: weeklyStart,
      periodEnd: now,
      improvedCount: weeklySummary.improvedCount,
      declinedCount: weeklySummary.declinedCount,
      stableCount: weeklySummary.stableCount,
      improved: weeklySummary.improved,
      declined: weeklySummary.declined,
      needsAttentionCount,
      recommendationUpdates: newRecommendationsSinceWeek,
      evidenceLoggedCount: evidenceSinceWeek,
      interpretation: buildChangeInterpretation({
        improvedCount: weeklySummary.improvedCount,
        declinedCount: weeklySummary.declinedCount,
        stableCount: weeklySummary.stableCount,
        evidenceLoggedCount: evidenceSinceWeek,
        needsAttentionCount,
      }),
    },
    suggestedActions: buildSuggestedActions({
      topRecommendation: activeRecommendations[0],
      topAttentionAttribute,
    }),
  };
}
