import { describe, expect, test } from "vitest";
import { computeDecayTransition } from "@/modules/decay/domain/decay-transition";

describe("computeDecayTransition", () => {
  test("applies decay while preserving floor and base/potential constraints", () => {
    const transition = computeDecayTransition({
      minValue: 0,
      maxValue: 20,
      currentValue: 12,
      baseValue: 10,
      potentialValue: 16,
      floorRatio: 0.6,
      decayPerDay: 0.2,
      baseDecayPerDay: 0.02,
      newApplicableCurrentDays: 8,
      newApplicableBaseDays: 3,
    });

    expect(transition.nextCurrent).toBeLessThan(12);
    expect(transition.nextBase).toBeLessThan(10);
    expect(transition.nextPotential).toBeGreaterThanOrEqual(transition.nextBase);
    expect(transition.currentDecayApplied).toBeGreaterThan(0);
  });
});
