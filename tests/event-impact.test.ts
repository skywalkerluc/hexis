import { describe, expect, test } from "vitest";
import { computeEventImpact } from "@/modules/evidence/application/compute-event-impact";

describe("computeEventImpact", () => {
  test("applies multi-attribute event impact with explainable deltas", () => {
    const impact = computeEventImpact({
      attributeSlug: "focus",
      eventType: "TRAINING",
      intensity: "INTENSE",
      selectedAttributeCount: 2,
      maintenanceBoostCurrent: 0.25,
      maintenanceBoostBase: 0.04,
      maintenanceBoostPotential: 0.02,
      recoveryBoostCurrent: 0.06,
      recoveryBoostBase: 0,
      recoveryBoostPotential: 0,
      minValue: 0,
      maxValue: 20,
      currentValue: 10,
      baseValue: 9.5,
      potentialValue: 15,
    });

    expect(impact.nextCurrent).toBeGreaterThan(10);
    expect(impact.nextBase).toBeGreaterThan(9.5);
    expect(impact.nextPotential).toBeGreaterThanOrEqual(15);
    expect(impact.explanation).toContain("training");
    expect(impact.explanation).toContain("2 attribute scope");
  });
});
