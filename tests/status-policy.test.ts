import { describe, expect, test } from "vitest";
import { deriveAttributeStatus } from "@/modules/attributes/domain/status-policy";

describe("deriveAttributeStatus", () => {
  test("returns improving when current is clearly above base", () => {
    expect(deriveAttributeStatus(12.4, 10.6, 20)).toBe("IMPROVING");
  });

  test("returns at risk when ratio is too low", () => {
    expect(deriveAttributeStatus(9, 9.4, 20)).toBe("AT_RISK");
  });

  test("returns decaying when current is below base trend", () => {
    expect(deriveAttributeStatus(12.1, 12.6, 20)).toBe("DECAYING");
  });
});
