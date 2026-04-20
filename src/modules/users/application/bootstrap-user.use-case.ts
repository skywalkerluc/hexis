import type { Prisma } from "@prisma/client";
import { DEFAULT_TIMEZONE } from "@/shared/kernel/scoring.constants";

export type BootstrapUserInput = {
  userId: string;
  displayName: string;
};

const INITIAL_CONSISTENCY_SCORE = 0;

export async function bootstrapUser(
  transactionClient: Prisma.TransactionClient,
  input: BootstrapUserInput,
): Promise<void> {
  const avatar = await transactionClient.avatarOption.findFirst({
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });

  if (!avatar) {
    throw new Error("No avatar option found. Run prisma seed first.");
  }

  const definitions = await transactionClient.attributeDefinition.findMany({
    orderBy: { name: "asc" },
  });

  await transactionClient.profile.create({
    data: {
      userId: input.userId,
      displayName: input.displayName,
      avatarOptionId: avatar.id,
      timezone: DEFAULT_TIMEZONE,
      onboardingDone: false,
    },
  });

  const createdAttributes = await transactionClient.userAttribute.createMany({
    data: definitions.map((definition) => ({
      userId: input.userId,
      attributeDefinitionId: definition.id,
      currentValue: definition.defaultCurrentValue,
      baseValue: definition.defaultBaseValue,
      potentialValue: definition.defaultPotentialValue,
      minValue: definition.scaleMin,
      maxValue: definition.scaleMax,
      consistencyScore: INITIAL_CONSISTENCY_SCORE,
    })),
  });

  if (createdAttributes.count !== definitions.length) {
    throw new Error("Failed to bootstrap user attributes.");
  }
}
