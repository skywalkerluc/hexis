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
    displayName: "Evidence Tester",
  });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    throw new Error("Expected user to exist after signup.");
  }

  return user.id;
}

async function resolveAttributeIds(userId: string): Promise<{ focusId: string; energyId: string }> {
  const attributes = await prisma.userAttribute.findMany({
    where: {
      userId,
      attributeDefinition: {
        slug: {
          in: ["focus", "energy"],
        },
      },
    },
    include: { attributeDefinition: { select: { slug: true } } },
  });

  const focus = attributes.find((attribute) => attribute.attributeDefinition.slug === "focus");
  const energy = attributes.find((attribute) => attribute.attributeDefinition.slug === "energy");

  if (!focus || !energy) {
    throw new Error("Expected focus and energy attributes.");
  }

  return { focusId: focus.id, energyId: energy.id };
}

describe.sequential("integration: evidence event atomicity", () => {
  beforeEach(async () => {
    await prepareIntegrationDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("commits event, impacts and history together on success", async () => {
    const userId = await createBootstrappedUser("atomic-success@hexis.app");
    const { focusId, energyId } = await resolveAttributeIds(userId);

    const { createEvidenceEventUseCase } = await import(
      "@/modules/evidence/application/create-evidence-event.use-case"
    );

    const result = await createEvidenceEventUseCase({
      userId,
      title: "Deep work block",
      eventType: "TRAINING",
      intensity: "INTENSE",
      occurredAt: new Date("2026-04-20T10:00:00.000Z"),
      userAttributeIds: [focusId, energyId],
    });

    const event = await prisma.evidenceEvent.findUnique({ where: { id: result.eventId } });
    const impacts = await prisma.evidenceEventImpact.findMany({ where: { eventId: result.eventId } });
    const logs = await prisma.attributeHistoryLog.findMany({
      where: { causeReferenceId: result.eventId, causeType: "EVENT" },
    });

    expect(event).not.toBeNull();
    expect(impacts).toHaveLength(2);
    expect(logs).toHaveLength(2);

    const focusAfter = await prisma.userAttribute.findUnique({ where: { id: focusId } });
    const energyAfter = await prisma.userAttribute.findUnique({ where: { id: energyId } });

    expect(focusAfter).not.toBeNull();
    expect(energyAfter).not.toBeNull();
    expect(focusAfter?.lastEventAt?.toISOString()).toBe("2026-04-20T10:00:00.000Z");
    expect(energyAfter?.lastEventAt?.toISOString()).toBe("2026-04-20T10:00:00.000Z");
  });

  test("rolls back everything when any impacted attribute cannot be processed", async () => {
    const userId = await createBootstrappedUser("atomic-rollback@hexis.app");
    const { focusId, energyId } = await resolveAttributeIds(userId);

    const focusBefore = await prisma.userAttribute.findUnique({ where: { id: focusId } });
    const energyBefore = await prisma.userAttribute.findUnique({ where: { id: energyId } });

    await prisma.decayProfile.deleteMany({
      where: {
        attributeDefinition: {
          slug: "energy",
        },
      },
    });

    const { createEvidenceEventUseCase } = await import(
      "@/modules/evidence/application/create-evidence-event.use-case"
    );

    await expect(
      createEvidenceEventUseCase({
        userId,
        title: "Should rollback",
        eventType: "TRAINING",
        intensity: "INTENSE",
        occurredAt: new Date("2026-04-20T10:00:00.000Z"),
        userAttributeIds: [focusId, energyId],
      }),
    ).rejects.toThrow("Missing decay profile");

    const eventCount = await prisma.evidenceEvent.count({ where: { userId } });
    const impactCount = await prisma.evidenceEventImpact.count({
      where: {
        userAttribute: {
          userId,
        },
      },
    });
    const logCount = await prisma.attributeHistoryLog.count({ where: { userId, causeType: "EVENT" } });

    const focusAfter = await prisma.userAttribute.findUnique({ where: { id: focusId } });
    const energyAfter = await prisma.userAttribute.findUnique({ where: { id: energyId } });

    expect(eventCount).toBe(0);
    expect(impactCount).toBe(0);
    expect(logCount).toBe(0);
    expect(focusAfter?.currentValue.toNumber()).toBe(focusBefore?.currentValue.toNumber());
    expect(energyAfter?.currentValue.toNumber()).toBe(energyBefore?.currentValue.toNumber());
    expect(focusAfter?.lastEventAt).toBeNull();
    expect(energyAfter?.lastEventAt).toBeNull();
  });
});
