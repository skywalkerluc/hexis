import { afterAll, beforeEach, describe, expect, test } from "vitest";
import {
  createTestPrismaClient,
  prepareIntegrationDatabase,
  setupIntegrationTestEnvironment,
} from "./support/test-db";

setupIntegrationTestEnvironment();

const prisma = createTestPrismaClient();

describe.sequential("integration: signup + bootstrap", () => {
  beforeEach(async () => {
    await prepareIntegrationDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("persists user, profile, user attributes and session", async () => {
    const { signupUseCase } = await import("@/modules/auth/application/signup.use-case");

    const result = await signupUseCase({
      email: "new@hexis.app",
      password: "very-strong-password",
      displayName: "Hexis User",
    });

    expect(result.sessionToken.length).toBeGreaterThan(10);

    const user = await prisma.user.findUnique({
      where: { email: "new@hexis.app" },
      include: {
        profile: true,
        userAttributes: true,
        sessions: true,
      },
    });

    expect(user).not.toBeNull();
    expect(user?.profile?.displayName).toBe("Hexis User");
    expect(user?.profile?.onboardingDone).toBe(false);
    expect(user?.userAttributes).toHaveLength(10);
    expect(user?.sessions).toHaveLength(1);

    const focus = await prisma.userAttribute.findFirst({
      where: {
        userId: user?.id,
        attributeDefinition: { slug: "focus" },
      },
      include: { attributeDefinition: true },
    });

    expect(focus).not.toBeNull();
    expect(focus?.currentValue.toNumber()).toBe(10.4);
    expect(focus?.baseValue.toNumber()).toBe(10);
    expect(focus?.potentialValue.toNumber()).toBe(15.8);
  });
});
