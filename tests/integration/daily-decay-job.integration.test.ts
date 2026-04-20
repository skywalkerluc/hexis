import { afterAll, beforeEach, describe, expect, test } from "vitest";
import {
  createTestPrismaClient,
  prepareIntegrationDatabase,
  setupIntegrationTestEnvironment,
} from "./support/test-db";

setupIntegrationTestEnvironment();

const prisma = createTestPrismaClient();

const FIRST_RUN_TIME = new Date("2026-04-20T08:00:00.000Z");
const SECOND_RUN_TIME = new Date("2026-04-20T18:00:00.000Z");
const OLD_EVENT_TIME = new Date("2026-03-25T08:00:00.000Z");
const OLD_DECAY_CHECK_TIME = new Date("2026-04-01T08:00:00.000Z");
const WORKER_A = "worker-a";
const WORKER_B = "worker-b";

async function createBootstrappedUser(email: string): Promise<string> {
  const { signupUseCase } = await import("@/modules/auth/application/signup.use-case");
  await signupUseCase({
    email,
    password: "very-strong-password",
    displayName: "Decay Tester",
  });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    throw new Error("Expected user to exist after signup.");
  }

  return user.id;
}

async function prepareDecayingState(userId: string): Promise<void> {
  const focus = await prisma.userAttribute.findFirst({
    where: {
      userId,
      attributeDefinition: { slug: "focus" },
    },
    select: { id: true },
  });

  if (!focus) {
    throw new Error("Expected focus attribute.");
  }

  await prisma.userAttribute.update({
    where: { id: focus.id },
    data: {
      lastEventAt: OLD_EVENT_TIME,
      lastDecayCheckAt: OLD_DECAY_CHECK_TIME,
    },
  });
}

describe.sequential("integration: daily decay job idempotency", () => {
  beforeEach(async () => {
    await prepareIntegrationDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("applies once per day and re-run skips using persisted run state", async () => {
    const userA = await createBootstrappedUser("decay-a@hexis.app");
    const userB = await createBootstrappedUser("decay-b@hexis.app");

    await prepareDecayingState(userA);
    await prepareDecayingState(userB);

    const { runDailyDecayUseCase } = await import("@/modules/decay/application/run-daily-decay.use-case");

    const firstRun = await runDailyDecayUseCase({ now: FIRST_RUN_TIME, workerId: WORKER_A });
    expect(firstRun.skipped).toBe(false);
    expect(firstRun.processedUsers).toBe(2);

    const firstDecayLogs = await prisma.attributeHistoryLog.count({ where: { causeType: "DECAY" } });
    expect(firstDecayLogs).toBeGreaterThanOrEqual(2);

    const secondRun = await runDailyDecayUseCase({ now: SECOND_RUN_TIME, workerId: WORKER_B });
    expect(secondRun.skipped).toBe(true);

    const secondDecayLogs = await prisma.attributeHistoryLog.count({ where: { causeType: "DECAY" } });
    expect(secondDecayLogs).toBe(firstDecayLogs);

    const jobRuns = await prisma.systemJobRun.findMany({
      where: { jobName: "daily_decay" },
      orderBy: { createdAt: "asc" },
    });

    expect(jobRuns).toHaveLength(1);
    expect(jobRuns[0]?.status).toBe("SUCCEEDED");
    expect(jobRuns[0]?.processedUsers).toBe(2);
  });

  test("prevents concurrent takeover when lease is still active", async () => {
    const userId = await createBootstrappedUser("decay-lease-active@hexis.app");
    await prepareDecayingState(userId);

    const leaseDay = new Date("2026-04-21T00:00:00.000Z");
    const leaseStartedAt = new Date("2026-04-21T08:00:00.000Z");
    const leaseLockedAt = new Date("2026-04-21T08:05:00.000Z");
    const leaseExpiresAt = new Date("2026-04-21T08:50:00.000Z");
    const competitorNow = new Date("2026-04-21T08:20:00.000Z");

    const activeRun = await prisma.systemJobRun.create({
      data: {
        jobName: "daily_decay",
        jobDay: leaseDay,
        status: "RUNNING",
        startedAt: leaseStartedAt,
        lockedBy: WORKER_A,
        lockedAt: leaseLockedAt,
        leaseExpiresAt,
      },
    });

    const { runDailyDecayUseCase } = await import("@/modules/decay/application/run-daily-decay.use-case");
    const skipped = await runDailyDecayUseCase({
      now: competitorNow,
      workerId: WORKER_B,
      currentTimeProvider: () => competitorNow,
    });

    expect(skipped.skipped).toBe(true);
    expect(skipped.jobRunId).toBe(activeRun.id);
  });

  test("recovers expired lease safely", async () => {
    const userId = await createBootstrappedUser("decay-stale@hexis.app");
    await prepareDecayingState(userId);

    const staleDay = new Date("2026-04-22T00:00:00.000Z");
    const staleStartedAt = new Date("2026-04-22T00:10:00.000Z");
    const staleLockedAt = new Date("2026-04-22T00:15:00.000Z");
    const staleLeaseExpiresAt = new Date("2026-04-22T00:55:00.000Z");
    const recoveryNow = new Date("2026-04-22T02:00:00.000Z");

    const staleRun = await prisma.systemJobRun.create({
      data: {
        jobName: "daily_decay",
        jobDay: staleDay,
        status: "RUNNING",
        startedAt: staleStartedAt,
        lockedBy: WORKER_A,
        lockedAt: staleLockedAt,
        leaseExpiresAt: staleLeaseExpiresAt,
      },
    });

    const { runDailyDecayUseCase } = await import("@/modules/decay/application/run-daily-decay.use-case");
    const recovery = await runDailyDecayUseCase({
      now: staleDay,
      workerId: WORKER_B,
      currentTimeProvider: () => recoveryNow,
    });

    expect(recovery.skipped).toBe(false);

    const persistedRun = await prisma.systemJobRun.findUnique({ where: { id: staleRun.id } });
    expect(persistedRun?.status).toBe("SUCCEEDED");
    expect(persistedRun?.processedUsers).toBe(1);
    expect(persistedRun?.lockedBy).toBeNull();
    expect(persistedRun?.leaseExpiresAt).toBeNull();
  });

  test("does not treat healthy long-running heartbeat state as stale", async () => {
    const userId = await createBootstrappedUser("decay-heartbeat@hexis.app");
    await prepareDecayingState(userId);

    const heartbeatDay = new Date("2026-04-23T00:00:00.000Z");
    const oldStartedAt = new Date("2026-04-23T01:00:00.000Z");
    const freshHeartbeatAt = new Date("2026-04-23T06:30:00.000Z");
    const freshLeaseExpiresAt = new Date("2026-04-23T07:15:00.000Z");
    const competitorNow = new Date("2026-04-23T06:45:00.000Z");

    const runningHealthy = await prisma.systemJobRun.create({
      data: {
        jobName: "daily_decay",
        jobDay: heartbeatDay,
        status: "RUNNING",
        startedAt: oldStartedAt,
        processedUsers: 14,
        impactedAttributes: 6,
        lockedBy: WORKER_A,
        lockedAt: freshHeartbeatAt,
        leaseExpiresAt: freshLeaseExpiresAt,
      },
    });

    const { runDailyDecayUseCase } = await import("@/modules/decay/application/run-daily-decay.use-case");
    const skipped = await runDailyDecayUseCase({
      now: heartbeatDay,
      workerId: WORKER_B,
      currentTimeProvider: () => competitorNow,
    });

    expect(skipped.skipped).toBe(true);
    expect(skipped.jobRunId).toBe(runningHealthy.id);
  });
});
