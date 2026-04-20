import { beforeEach, describe, expect, test, vi } from "vitest";

type RecommendationRecord = {
  id: string;
  userId: string;
  attributeDefinitionId: string;
  kind: "MAINTENANCE_BLOCK";
  title: string;
  rationale: string;
  expectedCurrentGain: number;
  priorityScore: number;
  status: "ACTIVE" | "DISMISSED" | "APPLIED" | "EXPIRED";
  generatedAt: Date;
  expiresAt: Date;
  lastEvaluatedAt: Date;
};

const memory = vi.hoisted(() => ({
  recommendations: [] as RecommendationRecord[],
  attributes: [
    {
      userId: "user-1",
      status: "AT_RISK",
      currentValue: { toNumber: () => 8 },
      baseValue: { toNumber: () => 10 },
      potentialValue: { toNumber: () => 15 },
      lastEventAt: new Date("2026-04-10T00:00:00.000Z"),
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      attributeDefinitionId: "focus-id",
      attributeDefinition: { name: "Focus" },
    },
  ],
}));

vi.mock("@/shared/db/prisma-client", () => {
  return {
    prismaClient: {
      userAttribute: {
        findMany: async () => memory.attributes,
      },
      recommendation: {
        updateMany: async ({ where, data }: { where: { userId: string; status: string; expiresAt?: { lt: Date } }; data: Partial<RecommendationRecord> }) => {
          let count = 0;
          for (const recommendation of memory.recommendations) {
            const expiredMatch = where.expiresAt ? recommendation.expiresAt < where.expiresAt.lt : true;
            if (recommendation.userId === where.userId && recommendation.status === where.status && expiredMatch) {
              Object.assign(recommendation, data);
              count += 1;
            }
          }
          return { count };
        },
        findMany: async ({ where }: { where: { userId: string; kind: "MAINTENANCE_BLOCK" } }) =>
          memory.recommendations.filter(
            (recommendation) =>
              recommendation.userId === where.userId && recommendation.kind === where.kind,
          ),
        create: async ({ data }: { data: Omit<RecommendationRecord, "id"> }) => {
          const created: RecommendationRecord = { ...data, id: `rec-${memory.recommendations.length + 1}` };
          memory.recommendations.push(created);
          return created;
        },
        update: async ({ where, data }: { where: { id: string }; data: Partial<RecommendationRecord> }) => {
          const target = memory.recommendations.find((recommendation) => recommendation.id === where.id);
          if (!target) {
            throw new Error("recommendation not found");
          }
          Object.assign(target, data);
          return target;
        },
      },
    },
  };
});

describe("integration: recommendation lifecycle", () => {
  beforeEach(() => {
    memory.recommendations.length = 0;
  });

  test("keeps stable identity and does not destroy dismissed recommendations", async () => {
    const { generateRecommendationsForUser } = await import(
      "@/modules/recommendations/application/generate-recommendations.use-case"
    );

    const now = new Date("2026-04-20T00:00:00.000Z");
    await generateRecommendationsForUser({ userId: "user-1", now });

    expect(memory.recommendations).toHaveLength(1);
    expect(memory.recommendations[0]?.status).toBe("ACTIVE");

    if (memory.recommendations[0]) {
      memory.recommendations[0].status = "DISMISSED";
    }

    await generateRecommendationsForUser({ userId: "user-1", now: new Date("2026-04-21T00:00:00.000Z") });

    expect(memory.recommendations).toHaveLength(1);
    expect(memory.recommendations[0]?.status).toBe("DISMISSED");
    expect(memory.recommendations[0]?.kind).toBe("MAINTENANCE_BLOCK");
    expect(memory.recommendations[0]?.lastEvaluatedAt.toISOString()).toBe("2026-04-21T00:00:00.000Z");
  });
});
