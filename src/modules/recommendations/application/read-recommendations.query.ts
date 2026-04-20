import { prismaClient } from "@/shared/db/prisma-client";
import { decimalToNumber } from "@/shared/kernel/decimal";

export type RecommendationView = {
  id: string;
  title: string;
  rationale: string;
  expectedCurrentGain: number;
  attributeName: string;
  generatedAt: Date;
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
    title: recommendation.title,
    rationale: recommendation.rationale,
    expectedCurrentGain: decimalToNumber(recommendation.expectedCurrentGain),
    attributeName: recommendation.attributeDefinition.name,
    generatedAt: recommendation.generatedAt,
  }));
}
