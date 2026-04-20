import type { AttributeStatus } from "@prisma/client";
import { STATUS_THRESHOLDS } from "@/shared/kernel/scoring.constants";

export function deriveAttributeStatus(currentValue: number, baseValue: number, maxValue: number): AttributeStatus {
  const delta = currentValue - baseValue;
  const ratio = maxValue <= 0 ? 0 : currentValue / maxValue;

  if (delta >= STATUS_THRESHOLDS.IMPROVING_DELTA) {
    return "IMPROVING";
  }

  if (ratio <= STATUS_THRESHOLDS.AT_RISK_RATIO) {
    return "AT_RISK";
  }

  if (delta <= STATUS_THRESHOLDS.DECAYING_DELTA) {
    return "DECAYING";
  }

  return "STABLE";
}
