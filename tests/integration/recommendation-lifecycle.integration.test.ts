import { afterAll, beforeEach, describe, expect, test } from "vitest";
import {
  createTestPrismaClient,
  prepareIntegrationDatabase,
  setupIntegrationTestEnvironment,
} from "./support/test-db";

setupIntegrationTestEnvironment();

const prisma = createTestPrismaClient();

const GENERATION_DAY_ONE = new Date("2026-04-20T08:00:00.000Z");
const GENERATION_DAY_TWO = new Date("2026-04-21T08:00:00.000Z");
const GENERATION_DAY_FIVE = new Date("2026-04-24T08:00:00.000Z");
const GENERATION_DAY_SIX = new Date("2026-04-25T08:00:00.000Z");
const GENERATION_DAY_EIGHT = new Date("2026-04-27T08:00:00.000Z");
const LAST_EVENT_STALE_DATE = new Date("2026-04-01T08:00:00.000Z");

async function createBootstrappedUser(email: string): Promise<string> {
  const { signupUseCase } = await import("@/modules/auth/application/signup.use-case");

  await signupUseCase({
    email,
    password: "very-strong-password",
    displayName: "Recommendation Tester",
  });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    throw new Error("Expected user to exist after signup.");
  }

  return user.id;
}

async function makeFocusAtRisk(userId: string): Promise<void> {
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
      status: "AT_RISK",
      currentValue: 7,
      baseValue: 10,
      potentialValue: 15,
      lastEventAt: LAST_EVENT_STALE_DATE,
    },
  });
}

describe.sequential("integration: recommendation lifecycle", () => {
  beforeEach(async () => {
    await prepareIntegrationDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("keeps stable identity and respects dismissed/applied reactivation windows", async () => {
    const userId = await createBootstrappedUser("recommendation@hexis.app");
    await makeFocusAtRisk(userId);

    const { generateRecommendationsForUser } = await import(
      "@/modules/recommendations/application/generate-recommendations.use-case"
    );
    const {
      dismissRecommendationUseCase,
      applyRecommendationUseCase,
    } = await import("@/modules/recommendations/application/update-recommendation-status.use-case");

    await generateRecommendationsForUser({ userId, now: GENERATION_DAY_ONE });

    const first = await prisma.recommendation.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    expect(first).not.toBeNull();
    expect(first?.status).toBe("ACTIVE");

    if (!first) {
      throw new Error("Recommendation must exist.");
    }

    await dismissRecommendationUseCase({
      userId,
      recommendationId: first.id,
      now: GENERATION_DAY_ONE,
    });

    await generateRecommendationsForUser({ userId, now: GENERATION_DAY_TWO });

    const afterDismissCooldown = await prisma.recommendation.findUnique({ where: { id: first.id } });
    expect(afterDismissCooldown?.status).toBe("DISMISSED");

    await generateRecommendationsForUser({ userId, now: GENERATION_DAY_FIVE });

    const reactivatedFromDismiss = await prisma.recommendation.findUnique({ where: { id: first.id } });
    expect(reactivatedFromDismiss?.status).toBe("ACTIVE");
    expect(reactivatedFromDismiss?.dismissedAt).toBeNull();

    await applyRecommendationUseCase({
      userId,
      recommendationId: first.id,
      now: GENERATION_DAY_FIVE,
    });

    await generateRecommendationsForUser({ userId, now: GENERATION_DAY_SIX });

    const afterAppliedCooldown = await prisma.recommendation.findUnique({ where: { id: first.id } });
    expect(afterAppliedCooldown?.status).toBe("APPLIED");

    await generateRecommendationsForUser({ userId, now: GENERATION_DAY_EIGHT });

    const reactivatedFromApplied = await prisma.recommendation.findUnique({ where: { id: first.id } });
    expect(reactivatedFromApplied?.status).toBe("ACTIVE");
    expect(reactivatedFromApplied?.appliedAt).toBeNull();

    const recommendationCountForFocus = await prisma.recommendation.count({
      where: {
        userId,
        attributeDefinitionId: first.attributeDefinitionId,
        kind: first.kind,
      },
    });
    expect(recommendationCountForFocus).toBe(1);
  });
});
