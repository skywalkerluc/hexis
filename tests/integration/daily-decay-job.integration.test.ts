import { beforeEach, describe, expect, test, vi } from "vitest";

type JobRunRecord = {
  id: string;
  jobName: string;
  jobDay: Date;
  status: "RUNNING" | "SUCCEEDED" | "FAILED";
  startedAt: Date;
  finishedAt: Date | null;
  processedUsers: number;
  impactedAttributes: number;
  failureReason: string | null;
};

const memory = vi.hoisted(() => ({
  users: [{ id: "u1" }, { id: "u2" }, { id: "u3" }],
  jobRuns: [] as JobRunRecord[],
  recalculateCalls: 0,
  recommendationCalls: 0,
}));

vi.mock("@/modules/decay/application/decay-recalculation.service", () => {
  return {
    recalculateDecayForUser: async () => {
      memory.recalculateCalls += 1;
      return { affectedAttributes: 2, totalCurrentDecay: 0.4 };
    },
  };
});

vi.mock("@/modules/recommendations/application/generate-recommendations.use-case", () => {
  return {
    generateRecommendationsForUser: async () => {
      memory.recommendationCalls += 1;
      return 1;
    },
  };
});

vi.mock("@/shared/db/prisma-client", () => {
  return {
    prismaClient: {
      systemJobRun: {
        findUnique: async ({ where }: { where: { jobName_jobDay: { jobName: string; jobDay: Date } } }) =>
          memory.jobRuns.find(
            (job) =>
              job.jobName === where.jobName_jobDay.jobName &&
              job.jobDay.getTime() === where.jobName_jobDay.jobDay.getTime(),
          ) ?? null,
        create: async ({ data }: { data: { jobName: string; jobDay: Date; status: JobRunRecord["status"]; startedAt: Date } }) => {
          const created: JobRunRecord = {
            id: `job-${memory.jobRuns.length + 1}`,
            jobName: data.jobName,
            jobDay: data.jobDay,
            status: data.status,
            startedAt: data.startedAt,
            finishedAt: null,
            processedUsers: 0,
            impactedAttributes: 0,
            failureReason: null,
          };
          memory.jobRuns.push(created);
          return created;
        },
        update: async ({ where, data }: { where: { id: string }; data: Partial<JobRunRecord> }) => {
          const target = memory.jobRuns.find((job) => job.id === where.id);
          if (!target) {
            throw new Error("job not found");
          }
          Object.assign(target, data);
          return target;
        },
      },
      user: {
        findMany: async ({ take, cursor, skip }: { take: number; cursor?: { id: string }; skip?: number }) => {
          const ordered = [...memory.users].sort((left, right) => left.id.localeCompare(right.id));
          if (!cursor) {
            return ordered.slice(0, take);
          }
          const index = ordered.findIndex((user) => user.id === cursor.id);
          const start = index + (skip ?? 0);
          return ordered.slice(start, start + take);
        },
      },
    },
  };
});

describe("integration: daily decay job", () => {
  beforeEach(() => {
    memory.jobRuns.length = 0;
    memory.recalculateCalls = 0;
    memory.recommendationCalls = 0;
  });

  test("is idempotent per day and processes users in batches", async () => {
    const { runDailyDecayUseCase } = await import("@/modules/decay/application/run-daily-decay.use-case");

    const now = new Date("2026-04-20T10:00:00.000Z");
    const first = await runDailyDecayUseCase({ now });
    const second = await runDailyDecayUseCase({ now: new Date("2026-04-20T16:00:00.000Z") });

    expect(first.skipped).toBe(false);
    expect(first.processedUsers).toBe(3);
    expect(first.impactedAttributes).toBe(6);
    expect(memory.recalculateCalls).toBe(3);
    expect(memory.recommendationCalls).toBe(3);

    expect(second.skipped).toBe(true);
    expect(memory.jobRuns).toHaveLength(1);
    expect(memory.jobRuns[0]?.status).toBe("SUCCEEDED");
  });
});
