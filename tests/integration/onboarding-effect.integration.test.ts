import { afterAll, beforeEach, describe, expect, test } from "vitest";
import {
  createTestPrismaClient,
  prepareIntegrationDatabase,
  setupIntegrationTestEnvironment,
} from "./support/test-db";

setupIntegrationTestEnvironment();

const prisma = createTestPrismaClient();

async function createBootstrappedUser(email: string): Promise<string> {
  const { signupUseCase } = await import("@/modules/auth/application/signup.use-case");

  await signupUseCase({
    email,
    password: "very-strong-password",
    displayName: "Onboarding Tester",
  });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    throw new Error("Expected user to exist after signup.");
  }

  return user.id;
}

describe.sequential("integration: onboarding effect", () => {
  beforeEach(async () => {
    await prepareIntegrationDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("applies selected template once and persists emphasis weights", async () => {
    const userId = await createBootstrappedUser("onboarding-once@hexis.app");

    const { completeOnboardingUseCase } = await import(
      "@/modules/onboarding/application/complete-onboarding.use-case"
    );

    await completeOnboardingUseCase({
      userId,
      templateKey: "deep-work",
      cultivationGoal: "CONCENTRACAO",
    });

    const profile = await prisma.profile.findUnique({ where: { userId } });
    const onboarding = await prisma.userOnboarding.findUnique({ where: { userId } });
    const focus = await prisma.userAttribute.findFirst({
      where: {
        userId,
        attributeDefinition: { slug: "focus" },
      },
    });

    expect(profile?.onboardingDone).toBe(true);
    expect(onboarding).not.toBeNull();
    expect(onboarding?.templateId).toBeDefined();
    expect(onboarding?.cultivationGoal).toBe("CONCENTRACAO");
    expect(focus?.onboardingEmphasisWeight?.toNumber()).toBe(1.45);

    const systemLogs = await prisma.attributeHistoryLog.count({
      where: {
        userId,
        causeType: "SYSTEM",
        causeReferenceId: "onboarding:deep-work",
      },
    });

    expect(systemLogs).toBe(10);

    await expect(
      completeOnboardingUseCase({
        userId,
        templateKey: "embodied-practice",
        cultivationGoal: "ENERGIA",
      }),
    ).rejects.toThrow("Onboarding already completed.");

    const onboardingCount = await prisma.userOnboarding.count({ where: { userId } });
    const systemLogCountAfterReplay = await prisma.attributeHistoryLog.count({
      where: {
        userId,
        causeType: "SYSTEM",
      },
    });

    expect(onboardingCount).toBe(1);
    expect(systemLogCountAfterReplay).toBe(10);
  });
});
