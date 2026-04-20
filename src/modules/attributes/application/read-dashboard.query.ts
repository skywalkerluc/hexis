import { readUserAttributes, computeCompositeScore, type UserAttributeView } from "@/modules/attributes/application/read-attributes.query";
import { readEvidenceHistory } from "@/modules/evidence/application/read-history.query";
import { readActiveRecommendations } from "@/modules/recommendations/application/read-recommendations.query";

export type DashboardView = {
  attributes: UserAttributeView[];
  composite: number;
  improvingCount: number;
  needsCareCount: number;
  eventCount: number;
  recentEvents: Awaited<ReturnType<typeof readEvidenceHistory>>;
  recommendations: Awaited<ReturnType<typeof readActiveRecommendations>>;
};

export async function readDashboard(userId: string): Promise<DashboardView> {
  const [attributes, events, recommendations] = await Promise.all([
    readUserAttributes(userId),
    readEvidenceHistory(userId),
    readActiveRecommendations(userId),
  ]);

  const improvingCount = attributes.filter((attribute) => attribute.status === "IMPROVING").length;
  const needsCareCount = attributes.filter(
    (attribute) => attribute.status === "DECAYING" || attribute.status === "AT_RISK",
  ).length;

  return {
    attributes,
    composite: computeCompositeScore(attributes),
    improvingCount,
    needsCareCount,
    eventCount: events.length,
    recentEvents: events.slice(0, 6),
    recommendations,
  };
}
