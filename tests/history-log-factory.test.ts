import { describe, expect, test } from "vitest";
import { buildHistoryLogEntry } from "@/modules/evidence/domain/history-log.factory";

describe("buildHistoryLogEntry", () => {
  test("builds explainable deterministic history payload", () => {
    const changedAt = new Date("2026-01-12T10:30:00.000Z");
    const entry = buildHistoryLogEntry({
      userId: "user_1",
      userAttributeId: "attribute_1",
      causeType: "EVENT",
      causeReferenceId: "event_1",
      explanation: "training intense impact applied with 2 attribute scope.",
      previousCurrent: 10,
      nextCurrent: 10.8,
      previousBase: 9.5,
      nextBase: 9.64,
      previousPotential: 15,
      nextPotential: 15.08,
      changedAt,
    });

    expect(entry.explanation.length).toBeGreaterThan(0);
    expect(entry.previousCurrent).toBe(10);
    expect(entry.nextCurrent).toBe(10.8);
    expect(entry.changedAt.toISOString()).toBe("2026-01-12T10:30:00.000Z");
  });
});
