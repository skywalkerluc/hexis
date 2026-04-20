import { Prisma } from "@prisma/client";
import { prismaClient } from "@/shared/db/prisma-client";
import { clampScore, decimalToNumber, roundScore } from "@/shared/kernel/decimal";
import { deriveAttributeStatus } from "@/modules/attributes/domain/status-policy";
import {
  ONBOARDING_BACKGROUND_BASE_DELTA,
  ONBOARDING_BACKGROUND_CURRENT_DELTA,
  ONBOARDING_BACKGROUND_POTENTIAL_DELTA,
  ONBOARDING_EMPHASIS_BASE_DELTA,
  ONBOARDING_EMPHASIS_CURRENT_DELTA,
  ONBOARDING_EMPHASIS_POTENTIAL_DELTA,
} from "@/modules/onboarding/domain/onboarding.constants";
import { buildHistoryLogEntry } from "@/modules/evidence/domain/history-log.factory";

export type CompleteOnboardingInput = {
  userId: string;
  templateKey: string;
};

export async function completeOnboardingUseCase(
  input: CompleteOnboardingInput,
): Promise<void> {
  const [template, profile] = await Promise.all([
    prismaClient.onboardingTemplate.findUnique({
      where: { key: input.templateKey },
      include: {
        attributes: {
          select: {
            attributeDefinitionId: true,
            emphasisWeight: true,
          },
        },
      },
    }),
    prismaClient.profile.findUnique({
      where: { userId: input.userId },
      select: { onboardingDone: true },
    }),
  ]);

  if (!template) {
    throw new Error("Template not found.");
  }
  if (!profile) {
    throw new Error("Profile not found.");
  }
  if (profile.onboardingDone) {
    throw new Error("Onboarding already completed.");
  }

  const emphasisByAttribute = new Map<string, number>(
    template.attributes.map((attribute) => [
      attribute.attributeDefinitionId,
      decimalToNumber(attribute.emphasisWeight),
    ]),
  );

  const now = new Date();

  try {
    await prismaClient.$transaction(async (transactionClient) => {
      const onboardingGate = await transactionClient.profile.updateMany({
        where: { userId: input.userId, onboardingDone: false },
        data: { onboardingDone: true },
      });

      if (onboardingGate.count !== 1) {
        throw new Error("Onboarding already completed.");
      }

      await transactionClient.userOnboarding.create({
        data: {
          userId: input.userId,
          templateId: template.id,
          completedAt: now,
        },
      });

      const userAttributes = await transactionClient.userAttribute.findMany({
        where: { userId: input.userId },
        include: {
          attributeDefinition: {
            select: {
              defaultCurrentValue: true,
              defaultBaseValue: true,
              defaultPotentialValue: true,
            },
          },
        },
      });

      for (const userAttribute of userAttributes) {
        const emphasisWeight = emphasisByAttribute.get(userAttribute.attributeDefinitionId);
        const minValue = decimalToNumber(userAttribute.minValue);
        const maxValue = decimalToNumber(userAttribute.maxValue);

        const baselineCurrent = decimalToNumber(userAttribute.attributeDefinition.defaultCurrentValue);
        const baselineBase = decimalToNumber(userAttribute.attributeDefinition.defaultBaseValue);
        const baselinePotential = decimalToNumber(userAttribute.attributeDefinition.defaultPotentialValue);

        const currentDelta =
          emphasisWeight === undefined
            ? ONBOARDING_BACKGROUND_CURRENT_DELTA
            : ONBOARDING_EMPHASIS_CURRENT_DELTA * emphasisWeight;

        const baseDelta =
          emphasisWeight === undefined
            ? ONBOARDING_BACKGROUND_BASE_DELTA
            : ONBOARDING_EMPHASIS_BASE_DELTA * emphasisWeight;

        const potentialDelta =
          emphasisWeight === undefined
            ? ONBOARDING_BACKGROUND_POTENTIAL_DELTA
            : ONBOARDING_EMPHASIS_POTENTIAL_DELTA * emphasisWeight;

        const nextBase = clampScore(baselineBase + baseDelta, minValue, maxValue);
        const nextCurrent = clampScore(Math.max(nextBase, baselineCurrent + currentDelta), minValue, maxValue);
        const nextPotential = clampScore(
          Math.max(nextBase, baselinePotential + potentialDelta),
          minValue,
          maxValue,
        );

        const previousCurrent = decimalToNumber(userAttribute.currentValue);
        const previousBase = decimalToNumber(userAttribute.baseValue);
        const previousPotential = decimalToNumber(userAttribute.potentialValue);

        await transactionClient.userAttribute.update({
          where: { id: userAttribute.id },
          data: {
            currentValue: nextCurrent,
            baseValue: nextBase,
            potentialValue: nextPotential,
            status: deriveAttributeStatus(nextCurrent, nextBase, maxValue),
            onboardingEmphasisWeight:
              emphasisWeight === undefined ? null : roundScore(emphasisWeight),
            lastDecayCheckAt: now,
          },
        });

        await transactionClient.attributeHistoryLog.create({
          data: buildHistoryLogEntry({
            userId: input.userId,
            userAttributeId: userAttribute.id,
            causeType: "SYSTEM",
            causeReferenceId: `onboarding:${template.key}`,
            explanation:
              emphasisWeight === undefined
                ? `Onboarding template '${template.label}' set this attribute as background emphasis.`
                : `Onboarding template '${template.label}' emphasized this attribute (weight ${emphasisWeight.toFixed(2)}).`,
            previousCurrent,
            nextCurrent,
            previousBase,
            nextBase,
            previousPotential,
            nextPotential,
            changedAt: now,
          }),
        });
      }
    });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Onboarding already completed.");
    }
    throw error;
  }
}
