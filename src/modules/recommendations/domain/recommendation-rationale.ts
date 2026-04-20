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
    return "This attribute is at risk right now.";
  }
  if (status === "DECAYING") {
    return "Recent drift suggests this trend can slip further.";
  }
  if (status === "IMPROVING") {
    return "Momentum is positive and can be consolidated.";
  }
  return "Current trend is stable but still needs reinforcement.";
}

export function buildRecommendationRationale(
  input: RecommendationRationaleInput,
): string {
  const deficit = input.baseValue - input.currentValue;
  const potentialGap = input.potentialValue - input.currentValue;

  const cadenceSignal =
    input.daysSinceEvent >= DAYS_STALE_THRESHOLD
      ? `${input.daysSinceEvent} day(s) without direct evidence.`
      : "Recent evidence cadence is light.";

  const baselineSignal =
    deficit > DEFICIT_MEANINGFUL_THRESHOLD
      ? `Current (${input.currentValue.toFixed(1)}) is below base (${input.baseValue.toFixed(1)}).`
      : "Current is near base, but reinforcement is still useful.";

  const opportunitySignal =
    potentialGap > POTENTIAL_GAP_THRESHOLD
      ? `There is still room below potential (${input.potentialValue.toFixed(1)}).`
      : "Potential headroom is limited, so precision matters.";

  const goalSignal = input.goalAligned
    ? "This is aligned with your declared cultivation goal."
    : "This supports overall balance across attributes.";

  return `${statusSignal(input.status)} ${cadenceSignal} ${baselineSignal} ${opportunitySignal} ${goalSignal}`;
}
