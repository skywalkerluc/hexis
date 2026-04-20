export const SCORE_MIN = 0;
export const SCORE_MAX = 20;
export const SCORE_PRECISION = 2;
export const DAYS_IN_WEEK = 7;
export const DEFAULT_TIMEZONE = "UTC";

export const EVENT_INTENSITY_MULTIPLIERS = {
  LIGHT: 0.55,
  MODERATE: 1,
  INTENSE: 1.45,
} as const;

export const EVENT_TYPE_IMPACT_FACTOR = {
  TRAINING: 1,
  PRACTICE: 0.9,
  ROUTINE: 0.7,
  ACHIEVEMENT: 1.2,
  RECOVERY: 0.8,
} as const;

export const STATUS_THRESHOLDS = {
  IMPROVING_DELTA: 0.25,
  DECAYING_DELTA: -0.25,
  AT_RISK_RATIO: 0.6,
} as const;

export const RECOMMENDATION_EXPIRY_DAYS = 5;
