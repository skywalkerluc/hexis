import { prismaClient } from "@/shared/db/prisma-client";
import { decimalToNumber, roundScore } from "@/shared/kernel/decimal";

export type UserAttributeView = {
  userAttributeId: string;
  definitionId: string;
  slug: string;
  name: string;
  shortCode: string;
  description: string;
  status: string;
  currentValue: number;
  baseValue: number;
  potentialValue: number;
  minValue: number;
  maxValue: number;
  lastEventAt: Date | null;
  lastDecayCheckAt: Date | null;
};

export async function readUserAttributes(userId: string): Promise<UserAttributeView[]> {
  const attributes = await prismaClient.userAttribute.findMany({
    where: { userId },
    include: { attributeDefinition: true },
    orderBy: { attributeDefinition: { name: "asc" } },
  });

  return attributes.map((attribute) => ({
    userAttributeId: attribute.id,
    definitionId: attribute.attributeDefinition.id,
    slug: attribute.attributeDefinition.slug,
    name: attribute.attributeDefinition.name,
    shortCode: attribute.attributeDefinition.shortCode,
    description: attribute.attributeDefinition.description,
    status: attribute.status,
    currentValue: decimalToNumber(attribute.currentValue),
    baseValue: decimalToNumber(attribute.baseValue),
    potentialValue: decimalToNumber(attribute.potentialValue),
    minValue: decimalToNumber(attribute.minValue),
    maxValue: decimalToNumber(attribute.maxValue),
    lastEventAt: attribute.lastEventAt,
    lastDecayCheckAt: attribute.lastDecayCheckAt,
  }));
}

export async function readUserAttributeDetail(
  userId: string,
  slug: string,
): Promise<UserAttributeView | null> {
  const attribute = await prismaClient.userAttribute.findFirst({
    where: {
      userId,
      attributeDefinition: { slug },
    },
    include: {
      attributeDefinition: true,
    },
  });

  if (!attribute) {
    return null;
  }

  return {
    userAttributeId: attribute.id,
    definitionId: attribute.attributeDefinition.id,
    slug: attribute.attributeDefinition.slug,
    name: attribute.attributeDefinition.name,
    shortCode: attribute.attributeDefinition.shortCode,
    description: attribute.attributeDefinition.description,
    status: attribute.status,
    currentValue: decimalToNumber(attribute.currentValue),
    baseValue: decimalToNumber(attribute.baseValue),
    potentialValue: decimalToNumber(attribute.potentialValue),
    minValue: decimalToNumber(attribute.minValue),
    maxValue: decimalToNumber(attribute.maxValue),
    lastEventAt: attribute.lastEventAt,
    lastDecayCheckAt: attribute.lastDecayCheckAt,
  };
}

export function computeCompositeScore(attributes: readonly UserAttributeView[]): number {
  if (attributes.length === 0) {
    return 0;
  }
  const sum = attributes.reduce((accumulator, attribute) => accumulator + attribute.currentValue, 0);
  return roundScore(sum / attributes.length);
}
