import { prismaClient } from "@/shared/db/prisma-client";
import { decimalToNumber } from "@/shared/kernel/decimal";

export type RecommendationView = {
  id: string;
  attributeDefinitionId: string;
  title: string;
  rationale: string;
  expectedCurrentGain: number;
  attributeName: string;
  status: "ACTIVE" | "DISMISSED" | "APPLIED" | "EXPIRED";
  generatedAt: Date;
  updatedAt: Date;
  dismissedAt: Date | null;
  appliedAt: Date | null;
};

export async function readActiveRecommendations(
  userId: string,
): Promise<RecommendationView[]> {
  const recommendations = await prismaClient.recommendation.findMany({
    where: {
      userId,
      status: "ACTIVE",
      expiresAt: { gte: new Date() },
    },
    include: {
      attributeDefinition: {
        select: { name: true },
      },
    },
    orderBy: { generatedAt: "desc" },
  });

  return recommendations.map((recommendation) => ({
    id: recommendation.id,
    attributeDefinitionId: recommendation.attributeDefinitionId,
    title: recommendation.title,
    rationale: recommendation.rationale,
    expectedCurrentGain: decimalToNumber(recommendation.expectedCurrentGain),
    attributeName: recommendation.attributeDefinition.name,
    status: recommendation.status,
    generatedAt: recommendation.generatedAt,
    updatedAt: recommendation.updatedAt,
    dismissedAt: recommendation.dismissedAt,
    appliedAt: recommendation.appliedAt,
  }));
}

export async function readRecommendationTimeline(
  userId: string,
): Promise<RecommendationView[]> {
  const recommendations = await prismaClient.recommendation.findMany({
    where: { userId },
    include: {
      attributeDefinition: {
        select: { name: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return recommendations.map((recommendation) => ({
    id: recommendation.id,
    attributeDefinitionId: recommendation.attributeDefinitionId,
    title: recommendation.title,
    rationale: recommendation.rationale,
    expectedCurrentGain: decimalToNumber(recommendation.expectedCurrentGain),
    attributeName: recommendation.attributeDefinition.name,
    status: recommendation.status,
    generatedAt: recommendation.generatedAt,
    updatedAt: recommendation.updatedAt,
    dismissedAt: recommendation.dismissedAt,
    appliedAt: recommendation.appliedAt,
  }));
}

export async function readRecommendationsForAttribute(
  userId: string,
  attributeDefinitionId: string,
): Promise<RecommendationView[]> {
  const recommendations = await prismaClient.recommendation.findMany({
    where: {
      userId,
      attributeDefinitionId,
    },
    include: {
      attributeDefinition: {
        select: { name: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  return recommendations.map((recommendation) => ({
    id: recommendation.id,
    attributeDefinitionId: recommendation.attributeDefinitionId,
    title: recommendation.title,
    rationale: recommendation.rationale,
    expectedCurrentGain: decimalToNumber(recommendation.expectedCurrentGain),
    attributeName: recommendation.attributeDefinition.name,
    status: recommendation.status,
    generatedAt: recommendation.generatedAt,
    updatedAt: recommendation.updatedAt,
    dismissedAt: recommendation.dismissedAt,
    appliedAt: recommendation.appliedAt,
  }));
}
