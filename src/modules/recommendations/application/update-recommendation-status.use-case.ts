import { prismaClient } from "@/shared/db/prisma-client";

export type DismissRecommendationInput = {
  userId: string;
  recommendationId: string;
  now: Date;
};

export type ApplyRecommendationInput = {
  userId: string;
  recommendationId: string;
  now: Date;
};

async function assertRecommendationOwnership(
  userId: string,
  recommendationId: string,
): Promise<void> {
  const existing = await prismaClient.recommendation.findUnique({
    where: { id: recommendationId },
    select: { userId: true },
  });

  if (!existing || existing.userId !== userId) {
    throw new Error("Recommendation not found.");
  }
}

export async function dismissRecommendationUseCase(
  input: DismissRecommendationInput,
): Promise<void> {
  const updated = await prismaClient.recommendation.updateMany({
    where: {
      id: input.recommendationId,
      userId: input.userId,
      status: "ACTIVE",
    },
    data: {
      status: "DISMISSED",
      dismissedAt: input.now,
      appliedAt: null,
      lastEvaluatedAt: input.now,
    },
  });

  if (updated.count === 1) {
    return;
  }

  await assertRecommendationOwnership(input.userId, input.recommendationId);
}

export async function applyRecommendationUseCase(
  input: ApplyRecommendationInput,
): Promise<void> {
  const updated = await prismaClient.recommendation.updateMany({
    where: {
      id: input.recommendationId,
      userId: input.userId,
      status: "ACTIVE",
    },
    data: {
      status: "APPLIED",
      appliedAt: input.now,
      dismissedAt: null,
      lastEvaluatedAt: input.now,
    },
  });

  if (updated.count === 1) {
    return;
  }

  await assertRecommendationOwnership(input.userId, input.recommendationId);
}
