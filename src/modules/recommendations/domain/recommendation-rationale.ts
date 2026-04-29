const DAYS_STALE_THRESHOLD = 3;
const DEFICIT_MEANINGFUL_THRESHOLD = 0.4;
const POTENTIAL_GAP_THRESHOLD = 1;

export type RecommendationRationaleInput = {
  attributeName: string;
  currentValue: number;
  baseValue: number;
  potentialValue: number;
  status: string;
  daysSinceEvent: number;
  goalAligned: boolean;
};

function statusSignal(status: string): string {
  if (status === "AT_RISK") {
    return "This area is showing clear risk right now.";
  }
  if (status === "DECAYING") {
    return "Recent drift suggests this can slip further without reinforcement.";
  }
  if (status === "IMPROVING") {
    return "Recent signals are positive, but still need reinforcement.";
  }
  return "This area is stable, but maintenance keeps it reliable.";
}

export function buildRecommendationRationale(
  input: RecommendationRationaleInput,
): string {
  const deficit = input.baseValue - input.currentValue;
  const potentialGap = input.potentialValue - input.currentValue;

  const freshnessSignal =
    input.daysSinceEvent >= DAYS_STALE_THRESHOLD
      ? `No direct log for ${input.daysSinceEvent} day(s).`
      : "Recent logs are still light.";

  const stateSignal =
    deficit > DEFICIT_MEANINGFUL_THRESHOLD
      ? `Current is below your stable baseline.`
      : "Current is near baseline, so a small reinforcement helps preserve it.";

  const opportunitySignal =
    potentialGap > POTENTIAL_GAP_THRESHOLD
      ? "There is still room to strengthen this area."
      : "Progress room is tighter, so consistency matters.";

  const directionSignal = input.goalAligned
    ? "This is aligned with your current focus."
    : "This helps keep overall balance.";

  const nextStepSignal = `Next step: log one short ${input.attributeName.toLowerCase()}-focused block this week.`;

  return `${statusSignal(input.status)} ${freshnessSignal} ${stateSignal} ${opportunitySignal} ${directionSignal} ${nextStepSignal}`;
}
