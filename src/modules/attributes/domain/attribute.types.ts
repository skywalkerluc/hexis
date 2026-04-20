import type { AttributeStatus, EvidenceEventType, EvidenceIntensity } from "@prisma/client";

export type AttributeScoreState = {
  currentValue: number;
  baseValue: number;
  potentialValue: number;
  minValue: number;
  maxValue: number;
};

export type AttributeRuntimeContext = {
  slug: string;
  status: AttributeStatus;
  consistencyScore: number;
  lastEventAt: Date | null;
  lastDecayCheckAt: Date | null;
};

export type EventImpactInput = {
  eventType: EvidenceEventType;
  intensity: EvidenceIntensity;
  selectedAttributeCount: number;
};

export type EventImpactResult = {
  deltaCurrent: number;
  deltaBase: number;
  deltaPotential: number;
  explanation: string;
};
