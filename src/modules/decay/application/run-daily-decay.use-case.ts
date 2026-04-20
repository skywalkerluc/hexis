import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prismaClient } from "@/shared/db/prisma-client";
import { recalculateDecayForUser } from "@/modules/decay/application/decay-recalculation.service";
import { generateRecommendationsForUser } from "@/modules/recommendations/application/generate-recommendations.use-case";
import { addMinutes, startOfUtcDay } from "@/modules/decay/domain/time";

const DAILY_DECAY_JOB_NAME = "daily_decay";
const USER_BATCH_SIZE = 50;
const LEASE_DURATION_MINUTES = 45;
const MAX_ACQUISITION_ATTEMPTS = 6;
const WORKER_ID_PREFIX = "daily-decay-worker";

export type RunDailyDecayInput = {
  now: Date;
  workerId?: string;
  currentTimeProvider?: () => Date;
};

export type RunDailyDecayResult = {
  processedUsers: number;
  impactedAttributes: number;
  skipped: boolean;
  jobRunId: string;
};

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

function buildWorkerId(): string {
  return `${WORKER_ID_PREFIX}:${randomUUID()}`;
}

function isLeaseExpired(leaseExpiresAt: Date | null, now: Date): boolean {
  if (!leaseExpiresAt) {
    return true;
  }
  return leaseExpiresAt.getTime() <= now.getTime();
}

function nextLeaseExpiry(now: Date): Date {
  return addMinutes(now, LEASE_DURATION_MINUTES);
}

async function tryAcquireExistingExpiredLease(input: {
  jobRunId: string;
  workerId: string;
  now: Date;
}): Promise<boolean> {
  const updated = await prismaClient.systemJobRun.updateMany({
    where: {
      id: input.jobRunId,
      status: "RUNNING",
      OR: [
        { leaseExpiresAt: null },
        { leaseExpiresAt: { lte: input.now } },
      ],
    },
    data: {
      status: "RUNNING",
      startedAt: input.now,
      finishedAt: null,
      failureReason: null,
      processedUsers: 0,
      impactedAttributes: 0,
      lockedBy: input.workerId,
      lockedAt: input.now,
      leaseExpiresAt: nextLeaseExpiry(input.now),
    },
  });

  return updated.count === 1;
}

async function tryAcquireFailedRun(input: {
  jobRunId: string;
  workerId: string;
  now: Date;
}): Promise<boolean> {
  const updated = await prismaClient.systemJobRun.updateMany({
    where: {
      id: input.jobRunId,
      status: "FAILED",
    },
    data: {
      status: "RUNNING",
      startedAt: input.now,
      finishedAt: null,
      failureReason: null,
      processedUsers: 0,
      impactedAttributes: 0,
      lockedBy: input.workerId,
      lockedAt: input.now,
      leaseExpiresAt: nextLeaseExpiry(input.now),
    },
  });

  return updated.count === 1;
}

async function tryCreateRun(input: {
  jobDay: Date;
  workerId: string;
  now: Date;
}): Promise<string | null> {
  try {
    const created = await prismaClient.systemJobRun.create({
      data: {
        jobName: DAILY_DECAY_JOB_NAME,
        jobDay: input.jobDay,
        status: "RUNNING",
        startedAt: input.now,
        lockedBy: input.workerId,
        lockedAt: input.now,
        leaseExpiresAt: nextLeaseExpiry(input.now),
      },
      select: { id: true },
    });
    return created.id;
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return null;
    }
    throw error;
  }
}

async function renewLease(input: {
  jobRunId: string;
  workerId: string;
  now: Date;
  processedUsers: number;
  impactedAttributes: number;
}): Promise<void> {
  const renewed = await prismaClient.systemJobRun.updateMany({
    where: {
      id: input.jobRunId,
      status: "RUNNING",
      lockedBy: input.workerId,
      leaseExpiresAt: { gt: input.now },
    },
    data: {
      processedUsers: input.processedUsers,
      impactedAttributes: input.impactedAttributes,
      lockedAt: input.now,
      leaseExpiresAt: nextLeaseExpiry(input.now),
    },
  });

  if (renewed.count !== 1) {
    throw new Error("Daily decay lease lost by worker.");
  }
}

export async function runDailyDecayUseCase(input: RunDailyDecayInput): Promise<RunDailyDecayResult> {
  const jobDay = startOfUtcDay(input.now);
  const workerId = input.workerId ?? buildWorkerId();
  const currentTime = input.currentTimeProvider ?? (() => new Date());

  let jobRunId: string | null = null;

  for (let attempt = 0; attempt < MAX_ACQUISITION_ATTEMPTS; attempt += 1) {
    const now = currentTime();
    const existingRun = await prismaClient.systemJobRun.findUnique({
      where: {
        jobName_jobDay: {
          jobName: DAILY_DECAY_JOB_NAME,
          jobDay,
        },
      },
    });

    if (!existingRun) {
      jobRunId = await tryCreateRun({
        jobDay,
        workerId,
        now,
      });
      if (jobRunId) {
        break;
      }
      continue;
    }

    if (existingRun.status === "SUCCEEDED") {
      return {
        processedUsers: existingRun.processedUsers,
        impactedAttributes: existingRun.impactedAttributes,
        skipped: true,
        jobRunId: existingRun.id,
      };
    }

    if (existingRun.status === "RUNNING") {
      const leaseExpired = isLeaseExpired(existingRun.leaseExpiresAt, now);

      if (!leaseExpired && existingRun.lockedBy !== workerId) {
        return {
          processedUsers: existingRun.processedUsers,
          impactedAttributes: existingRun.impactedAttributes,
          skipped: true,
          jobRunId: existingRun.id,
        };
      }

      if (existingRun.lockedBy === workerId && !leaseExpired) {
        return {
          processedUsers: existingRun.processedUsers,
          impactedAttributes: existingRun.impactedAttributes,
          skipped: true,
          jobRunId: existingRun.id,
        };
      }

      const recovered = await tryAcquireExistingExpiredLease({
        jobRunId: existingRun.id,
        workerId,
        now,
      });

      if (recovered) {
        console.warn("[hexis.jobs.daily_decay] expired_lease_recovered", {
          jobRunId: existingRun.id,
          workerId,
          now: now.toISOString(),
        });
        jobRunId = existingRun.id;
        break;
      }

      continue;
    }

    const restarted = await tryAcquireFailedRun({
      jobRunId: existingRun.id,
      workerId,
      now,
    });

    if (restarted) {
      jobRunId = existingRun.id;
      break;
    }
  }

  if (!jobRunId) {
    const existingRun = await prismaClient.systemJobRun.findUnique({
      where: {
        jobName_jobDay: {
          jobName: DAILY_DECAY_JOB_NAME,
          jobDay,
        },
      },
    });

    if (!existingRun) {
      throw new Error("Unable to acquire daily decay lease.");
    }

    return {
      processedUsers: existingRun.processedUsers,
      impactedAttributes: existingRun.impactedAttributes,
      skipped: true,
      jobRunId: existingRun.id,
    };
  }

  await renewLease({
    jobRunId,
    workerId,
    now: currentTime(),
    processedUsers: 0,
    impactedAttributes: 0,
  });

  let processedUsers = 0;
  let impactedAttributes = 0;
  let cursorId: string | undefined;

  console.info("[hexis.jobs.daily_decay] started", {
    jobRunId,
    jobDay: jobDay.toISOString(),
    workerId,
    leaseDurationMinutes: LEASE_DURATION_MINUTES,
  });

  try {
    while (true) {
      const users = await prismaClient.user.findMany({
        select: { id: true },
        orderBy: { id: "asc" },
        take: USER_BATCH_SIZE,
        ...(cursorId
          ? {
              cursor: { id: cursorId },
              skip: 1,
            }
          : {}),
      });

      if (users.length === 0) {
        break;
      }

      for (const user of users) {
        await renewLease({
          jobRunId,
          workerId,
          now: currentTime(),
          processedUsers,
          impactedAttributes,
        });

        const result = await recalculateDecayForUser({ userId: user.id, now: input.now });
        impactedAttributes += result.affectedAttributes;
        await generateRecommendationsForUser({ userId: user.id, now: input.now });
        processedUsers += 1;

        await renewLease({
          jobRunId,
          workerId,
          now: currentTime(),
          processedUsers,
          impactedAttributes,
        });
      }

      cursorId = users[users.length - 1]?.id;

      console.info("[hexis.jobs.daily_decay] batch_processed", {
        jobRunId,
        workerId,
        batchSize: users.length,
        processedUsers,
        impactedAttributes,
      });
    }

    const completed = await prismaClient.systemJobRun.updateMany({
      where: {
        id: jobRunId,
        status: "RUNNING",
        lockedBy: workerId,
      },
      data: {
        status: "SUCCEEDED",
        finishedAt: currentTime(),
        processedUsers,
        impactedAttributes,
        lockedBy: null,
        lockedAt: null,
        leaseExpiresAt: null,
      },
    });

    if (completed.count !== 1) {
      throw new Error("Daily decay lease lost before completion.");
    }

    console.info("[hexis.jobs.daily_decay] finished", {
      jobRunId,
      workerId,
      processedUsers,
      impactedAttributes,
    });

    return {
      processedUsers,
      impactedAttributes,
      skipped: false,
      jobRunId,
    };
  } catch (error: unknown) {
    const failureReason = error instanceof Error ? error.message : "unknown_error";

    await prismaClient.systemJobRun.updateMany({
      where: {
        id: jobRunId,
        status: "RUNNING",
        lockedBy: workerId,
      },
      data: {
        status: "FAILED",
        finishedAt: currentTime(),
        processedUsers,
        impactedAttributes,
        failureReason,
        lockedBy: null,
        lockedAt: null,
        leaseExpiresAt: null,
      },
    });

    console.error("[hexis.jobs.daily_decay] failed", {
      jobRunId,
      workerId,
      processedUsers,
      impactedAttributes,
      failureReason,
    });

    throw error;
  }
}
