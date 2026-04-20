import { roundScore } from "@/shared/kernel/decimal";

const DEFICIT_WEIGHT = 1;
const UNREALIZED_WEIGHT = 0.3;
const STALENESS_WEIGHT = 0.04;
const DECAYING_RISK_BONUS = 1;
const AT_RISK_BONUS = 2;

export type RecommendationScoreInput = {
  status: string;
  currentValue: number;
  baseValue: number;
  potentialValue: number;
  daysSinceEvent: number;
};

export type RecommendationScore = {
  score: number;
  deficit: number;
};

export function scoreRecommendationCandidate(
  input: RecommendationScoreInput,
): RecommendationScore {
  const deficit = roundScore(input.baseValue - input.currentValue);
  const unrealized = roundScore(input.potentialValue - input.currentValue);
  const riskBoost =
    input.status === "AT_RISK"
      ? AT_RISK_BONUS
      : input.status === "DECAYING"
        ? DECAYING_RISK_BONUS
        : 0;

  const score =
    deficit * DEFICIT_WEIGHT +
    unrealized * UNREALIZED_WEIGHT +
    input.daysSinceEvent * STALENESS_WEIGHT +
    riskBoost;

  return {
    score: roundScore(score),
    deficit,
  };
}
