import { Prisma } from "@prisma/client";
import { prismaClient } from "@/shared/db/prisma-client";
import { recalculateDecayForUser } from "@/modules/decay/application/decay-recalculation.service";
import { generateRecommendationsForUser } from "@/modules/recommendations/application/generate-recommendations.use-case";
import { startOfUtcDay } from "@/modules/decay/domain/time";

const DAILY_DECAY_JOB_NAME = "daily_decay";
const USER_BATCH_SIZE = 50;

export type RunDailyDecayInput = {
  now: Date;
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

export async function runDailyDecayUseCase(input: RunDailyDecayInput): Promise<RunDailyDecayResult> {
  const jobDay = startOfUtcDay(input.now);

  const existingRun = await prismaClient.systemJobRun.findUnique({
    where: {
      jobName_jobDay: {
        jobName: DAILY_DECAY_JOB_NAME,
        jobDay,
      },
    },
  });

  if (existingRun?.status === "SUCCEEDED" || existingRun?.status === "RUNNING") {
    return {
      processedUsers: existingRun.processedUsers,
      impactedAttributes: existingRun.impactedAttributes,
      skipped: true,
      jobRunId: existingRun.id,
    };
  }

  let jobRunId: string;

  if (existingRun?.status === "FAILED") {
    const restarted = await prismaClient.systemJobRun.update({
      where: { id: existingRun.id },
      data: {
        status: "RUNNING",
        startedAt: input.now,
        finishedAt: null,
        failureReason: null,
        processedUsers: 0,
        impactedAttributes: 0,
      },
    });
    jobRunId = restarted.id;
  } else {
    try {
      const created = await prismaClient.systemJobRun.create({
        data: {
          jobName: DAILY_DECAY_JOB_NAME,
          jobDay,
          status: "RUNNING",
          startedAt: input.now,
        },
      });
      jobRunId = created.id;
    } catch (error: unknown) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const concurrentRun = await prismaClient.systemJobRun.findUnique({
        where: {
          jobName_jobDay: {
            jobName: DAILY_DECAY_JOB_NAME,
            jobDay,
          },
        },
      });

      if (!concurrentRun) {
        throw error;
      }

      return {
        processedUsers: concurrentRun.processedUsers,
        impactedAttributes: concurrentRun.impactedAttributes,
        skipped: true,
        jobRunId: concurrentRun.id,
      };
    }
  }

  let processedUsers = 0;
  let impactedAttributes = 0;
  let cursorId: string | undefined;

  console.info("[hexis.jobs.daily_decay] started", {
    jobRunId,
    jobDay: jobDay.toISOString(),
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
        const result = await recalculateDecayForUser({ userId: user.id, now: input.now });
        impactedAttributes += result.affectedAttributes;
        await generateRecommendationsForUser({ userId: user.id, now: input.now });
      }

      processedUsers += users.length;
      cursorId = users[users.length - 1]?.id;

      await prismaClient.systemJobRun.update({
        where: { id: jobRunId },
        data: {
          processedUsers,
          impactedAttributes,
        },
      });

      console.info("[hexis.jobs.daily_decay] batch_processed", {
        jobRunId,
        batchSize: users.length,
        processedUsers,
        impactedAttributes,
      });
    }

    await prismaClient.systemJobRun.update({
      where: { id: jobRunId },
      data: {
        status: "SUCCEEDED",
        finishedAt: new Date(),
        processedUsers,
        impactedAttributes,
      },
    });

    console.info("[hexis.jobs.daily_decay] finished", {
      jobRunId,
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

    await prismaClient.systemJobRun.update({
      where: { id: jobRunId },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        processedUsers,
        impactedAttributes,
        failureReason,
      },
    });

    console.error("[hexis.jobs.daily_decay] failed", {
      jobRunId,
      processedUsers,
      impactedAttributes,
      failureReason,
    });

    throw error;
  }
}
