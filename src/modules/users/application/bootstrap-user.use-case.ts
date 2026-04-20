import { prismaClient } from "@/shared/db/prisma-client";
import { DEFAULT_TIMEZONE } from "@/shared/kernel/scoring.constants";

export type BootstrapUserInput = {
  userId: string;
  displayName: string;
};

export async function bootstrapUser(input: BootstrapUserInput): Promise<void> {
  const avatar = await prismaClient.avatarOption.findFirst({
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });

  if (!avatar) {
    throw new Error("No avatar option found. Run prisma seed first.");
  }

  const definitions = await prismaClient.attributeDefinition.findMany({
    orderBy: { name: "asc" },
  });

  await prismaClient.profile.create({
    data: {
      userId: input.userId,
      displayName: input.displayName,
      avatarOptionId: avatar.id,
      timezone: DEFAULT_TIMEZONE,
      onboardingDone: false,
    },
  });

  for (const definition of definitions) {
    await prismaClient.userAttribute.create({
      data: {
        userId: input.userId,
        attributeDefinitionId: definition.id,
        currentValue: definition.defaultCurrentValue,
        baseValue: definition.defaultBaseValue,
        potentialValue: definition.defaultPotentialValue,
        minValue: definition.scaleMin,
        maxValue: definition.scaleMax,
        consistencyScore: 0,
      },
    });
  }
}
