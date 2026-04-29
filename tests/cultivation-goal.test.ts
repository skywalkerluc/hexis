import { describe, it, expect } from "vitest";
import {
  CULTIVATION_GOAL_OPTIONS,
  readCultivationGoal,
} from "@/modules/onboarding/domain/cultivation-goal";

describe("cultivation goals", () => {
  it("should have exactly 10 goal options", () => {
    expect(CULTIVATION_GOAL_OPTIONS).toHaveLength(10);
  });

  it("should have all labels in Portuguese", () => {
    const labels = CULTIVATION_GOAL_OPTIONS.map((g) => g.label);
    expect(labels).toContain("Concentração");
    expect(labels).toContain("Energia");
    expect(labels).toContain("Disciplina");
    expect(labels).toContain("Força");
    expect(labels).toContain("Criatividade");
    expect(labels).toContain("Equilíbrio");
    expect(labels).toContain("Aprendizado");
    expect(labels).toContain("Comunicação");
    expect(labels).toContain("Finanças");
    expect(labels).toContain("Coragem");
  });

  it("should return a valid goal view for each goal", () => {
    for (const option of CULTIVATION_GOAL_OPTIONS) {
      const view = readCultivationGoal(option.value);
      expect(view.value).toBe(option.value);
      expect(view.label).toBe(option.label);
      expect(view.focusAttributeSlugs.length).toBeGreaterThan(0);
    }
  });

  it("should throw for unknown goal", () => {
    expect(() => readCultivationGoal("UNKNOWN" as any)).toThrow();
  });
});
