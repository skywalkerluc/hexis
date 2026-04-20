import { SCORE_PRECISION } from "@/shared/kernel/scoring.constants";

const PRECISION_FACTOR = 10 ** SCORE_PRECISION;

export function roundScore(value: number): number {
  return Math.round(value * PRECISION_FACTOR) / PRECISION_FACTOR;
}

export function clampScore(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return roundScore(value);
}

export function decimalToNumber(value: { toNumber(): number }): number {
  return value.toNumber();
}
