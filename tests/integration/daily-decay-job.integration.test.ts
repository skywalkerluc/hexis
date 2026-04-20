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

    const firstRun = await runDailyDecayUseCase({ now: FIRST_RUN_TIME });
    expect(firstRun.skipped).toBe(false);
    expect(firstRun.processedUsers).toBe(2);

    const firstDecayLogs = await prisma.attributeHistoryLog.count({ where: { causeType: "DECAY" } });
    expect(firstDecayLogs).toBeGreaterThanOrEqual(2);

    const secondRun = await runDailyDecayUseCase({ now: SECOND_RUN_TIME });
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

  test("recovers stale RUNNING runs instead of skipping forever", async () => {
    const userId = await createBootstrappedUser("decay-stale@hexis.app");
    await prepareDecayingState(userId);

    const staleDay = new Date("2026-04-21T00:00:00.000Z");
    const staleStartedAt = new Date("2026-04-21T00:10:00.000Z");
    const staleUpdatedAt = new Date("2026-04-21T00:15:00.000Z");
    const recoveryNow = new Date("2026-04-21T02:00:00.000Z");

    const staleRun = await prisma.systemJobRun.create({
      data: {
        jobName: "daily_decay",
        jobDay: staleDay,
        status: "RUNNING",
        startedAt: staleStartedAt,
      },
    });

    await prisma.$executeRawUnsafe(
      `UPDATE "SystemJobRun" SET "updatedAt" = $1 WHERE "id" = $2`,
      staleUpdatedAt,
      staleRun.id,
    );

    const { runDailyDecayUseCase } = await import("@/modules/decay/application/run-daily-decay.use-case");
    const recovery = await runDailyDecayUseCase({ now: recoveryNow });

    expect(recovery.skipped).toBe(false);

    const persistedRun = await prisma.systemJobRun.findUnique({ where: { id: staleRun.id } });
    expect(persistedRun?.status).toBe("SUCCEEDED");
    expect(persistedRun?.processedUsers).toBe(1);
  });
});
