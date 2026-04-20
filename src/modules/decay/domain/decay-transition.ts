import { clampScore, roundScore } from "@/shared/kernel/decimal";

const POTENTIAL_EROSION_MULTIPLIER = 0.5;

export type DecayTransitionInput = {
  minValue: number;
  maxValue: number;
  currentValue: number;
  baseValue: number;
  potentialValue: number;
  floorRatio: number;
  decayPerDay: number;
  baseDecayPerDay: number;
  newApplicableCurrentDays: number;
  newApplicableBaseDays: number;
};

export type DecayTransitionOutput = {
  nextCurrent: number;
  nextBase: number;
  nextPotential: number;
  currentDecayApplied: number;
};

export function computeDecayTransition(input: DecayTransitionInput): DecayTransitionOutput {
  const currentDecay = input.newApplicableCurrentDays * input.decayPerDay;
  const baseDecay = input.newApplicableBaseDays * input.baseDecayPerDay;
  const potentialDecay = baseDecay * POTENTIAL_EROSION_MULTIPLIER;

  const floorValue = roundScore(
    input.minValue + (input.baseValue - input.minValue) * input.floorRatio,
  );

  const nextBase = clampScore(input.baseValue - baseDecay, input.minValue, input.maxValue);
  const nextCurrent = clampScore(input.currentValue - currentDecay, floorValue, input.maxValue);
  const nextPotential = clampScore(
    Math.max(nextBase, input.potentialValue - potentialDecay),
    input.minValue,
    input.maxValue,
  );

  return {
    nextCurrent,
    nextBase,
    nextPotential,
    currentDecayApplied: roundScore(input.currentValue - nextCurrent),
  };
}
