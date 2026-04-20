import { describe, expect, test } from "vitest";
import { scoreRecommendationCandidate } from "@/modules/recommendations/domain/recommendation-scoring";

describe("scoreRecommendationCandidate", () => {
  test("prioritizes at-risk attributes with deficit and staleness", () => {
    const atRiskScore = scoreRecommendationCandidate({
      status: "AT_RISK",
      currentValue: 8,
      baseValue: 10,
      potentialValue: 15,
      daysSinceEvent: 6,
    });

    const stableScore = scoreRecommendationCandidate({
      status: "STABLE",
      currentValue: 9.8,
      baseValue: 10,
      potentialValue: 12,
      daysSinceEvent: 1,
    });

    expect(atRiskScore.score).toBeGreaterThan(stableScore.score);
    expect(atRiskScore.deficit).toBeGreaterThan(stableScore.deficit);
  });
});
