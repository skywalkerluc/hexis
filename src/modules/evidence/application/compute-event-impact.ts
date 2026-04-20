import type { EvidenceEventType, EvidenceIntensity } from "@prisma/client";
import { clampScore, roundScore } from "@/shared/kernel/decimal";
import { resolveAttributeImpactRule, resolveEventTypeMultiplier, resolveIntensityMultiplier } from "@/modules/evidence/domain/event-impact-rules";

const RECOVERY_EVENT_TYPE: EvidenceEventType = "RECOVERY";
const MULTI_ATTRIBUTE_ATTENUATION_STEP = 0.06;
const MULTI_ATTRIBUTE_ATTENUATION_MIN = 0.7;

export type ComputeEventImpactInput = {
  attributeSlug: string;
  eventType: EvidenceEventType;
  intensity: EvidenceIntensity;
  selectedAttributeCount: number;
  maintenanceBoostCurrent: number;
  maintenanceBoostBase: number;
  maintenanceBoostPotential: number;
  recoveryBoostCurrent: number;
  recoveryBoostBase: number;
  recoveryBoostPotential: number;
  minValue: number;
  maxValue: number;
  currentValue: number;
  baseValue: number;
  potentialValue: number;
};

export type ComputedImpact = {
  nextCurrent: number;
  nextBase: number;
  nextPotential: number;
  deltaCurrent: number;
  deltaBase: number;
  deltaPotential: number;
  explanation: string;
};

export function computeEventImpact(input: ComputeEventImpactInput): ComputedImpact {
  const attributeRule = resolveAttributeImpactRule(input.attributeSlug);
  const intensityMultiplier = resolveIntensityMultiplier(input.intensity);
  const eventTypeMultiplier = resolveEventTypeMultiplier(input.eventType);
  const attenuationBySpread = Math.max(
    MULTI_ATTRIBUTE_ATTENUATION_MIN,
    1 - Math.max(0, input.selectedAttributeCount - 1) * MULTI_ATTRIBUTE_ATTENUATION_STEP,
  );

  const isRecovery = input.eventType === RECOVERY_EVENT_TYPE;
  const ruleWeight = isRecovery ? attributeRule.recoveryWeight : attributeRule.maintenanceWeight;
  const profileCurrentBoost = isRecovery
    ? input.recoveryBoostCurrent
    : input.maintenanceBoostCurrent;
  const profileBaseBoost = isRecovery ? input.recoveryBoostBase : input.maintenanceBoostBase;
  const profilePotentialBoost = isRecovery
    ? input.recoveryBoostPotential
    : input.maintenanceBoostPotential;

  const rawCurrentDelta =
    ruleWeight * intensityMultiplier * eventTypeMultiplier * attenuationBySpread + profileCurrentBoost;

  const rawBaseDelta = rawCurrentDelta * attributeRule.baseShiftRatio + profileBaseBoost;
  const rawPotentialDelta =
    rawCurrentDelta * attributeRule.potentialShiftRatio + profilePotentialBoost;

  const nextCurrent = clampScore(input.currentValue + rawCurrentDelta, input.minValue, input.maxValue);
  const nextBase = clampScore(input.baseValue + rawBaseDelta, input.minValue, input.maxValue);
  const nextPotential = clampScore(
    Math.max(input.baseValue, input.potentialValue + rawPotentialDelta),
    input.minValue,
    input.maxValue,
  );

  const deltaCurrent = roundScore(nextCurrent - input.currentValue);
  const deltaBase = roundScore(nextBase - input.baseValue);
  const deltaPotential = roundScore(nextPotential - input.potentialValue);

  const explanation = `${input.eventType.toLowerCase()} ${input.intensity.toLowerCase()} impact applied with ${input.selectedAttributeCount} attribute scope.`;

  return {
    nextCurrent,
    nextBase,
    nextPotential,
    deltaCurrent,
    deltaBase,
    deltaPotential,
    explanation,
  };
}
