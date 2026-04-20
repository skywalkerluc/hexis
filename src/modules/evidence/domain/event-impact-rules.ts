import type { EvidenceEventType, EvidenceIntensity } from "@prisma/client";
import {
  EVENT_INTENSITY_MULTIPLIERS,
  EVENT_TYPE_IMPACT_FACTOR,
} from "@/shared/kernel/scoring.constants";

export type AttributeImpactRule = {
  maintenanceWeight: number;
  recoveryWeight: number;
  baseShiftRatio: number;
  potentialShiftRatio: number;
};

export const ATTRIBUTE_IMPACT_RULES: Readonly<Record<string, AttributeImpactRule>> = {
  focus: { maintenanceWeight: 1, recoveryWeight: 0.4, baseShiftRatio: 0.18, potentialShiftRatio: 0.08 },
  discipline: { maintenanceWeight: 0.95, recoveryWeight: 0.3, baseShiftRatio: 0.22, potentialShiftRatio: 0.09 },
  energy: { maintenanceWeight: 0.8, recoveryWeight: 1, baseShiftRatio: 0.14, potentialShiftRatio: 0.06 },
  organization: { maintenanceWeight: 0.85, recoveryWeight: 0.35, baseShiftRatio: 0.2, potentialShiftRatio: 0.09 },
  resilience: { maintenanceWeight: 0.75, recoveryWeight: 0.5, baseShiftRatio: 0.24, potentialShiftRatio: 0.1 },
  memory: { maintenanceWeight: 0.9, recoveryWeight: 0.3, baseShiftRatio: 0.18, potentialShiftRatio: 0.09 },
  creativity: { maintenanceWeight: 0.88, recoveryWeight: 0.5, baseShiftRatio: 0.16, potentialShiftRatio: 0.12 },
  leadership: { maintenanceWeight: 0.83, recoveryWeight: 0.25, baseShiftRatio: 0.21, potentialShiftRatio: 0.08 },
  "emotional-control": {
    maintenanceWeight: 0.82,
    recoveryWeight: 0.7,
    baseShiftRatio: 0.2,
    potentialShiftRatio: 0.08,
  },
  "physical-endurance": {
    maintenanceWeight: 0.86,
    recoveryWeight: 0.75,
    baseShiftRatio: 0.2,
    potentialShiftRatio: 0.09,
  },
};

export function resolveIntensityMultiplier(intensity: EvidenceIntensity): number {
  return EVENT_INTENSITY_MULTIPLIERS[intensity];
}

export function resolveEventTypeMultiplier(eventType: EvidenceEventType): number {
  return EVENT_TYPE_IMPACT_FACTOR[eventType];
}

export function resolveAttributeImpactRule(slug: string): AttributeImpactRule {
  const fallbackRule: AttributeImpactRule = {
    maintenanceWeight: 0.8,
    recoveryWeight: 0.4,
    baseShiftRatio: 0.16,
    potentialShiftRatio: 0.08,
  };

  return ATTRIBUTE_IMPACT_RULES[slug] ?? fallbackRule;
}
