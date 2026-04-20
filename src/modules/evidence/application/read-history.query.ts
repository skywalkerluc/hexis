import { prismaClient } from "@/shared/db/prisma-client";
import { decimalToNumber } from "@/shared/kernel/decimal";

export type EvidenceHistoryView = {
  id: string;
  title: string;
  notes: string | null;
  eventType: string;
  intensity: string;
  occurredAt: Date;
  impacts: {
    userAttributeId: string;
    attributeName: string;
    attributeSlug: string;
    deltaCurrent: number;
    explanation: string;
  }[];
};

export async function readEvidenceHistory(userId: string): Promise<EvidenceHistoryView[]> {
  const events = await prismaClient.evidenceEvent.findMany({
    where: { userId },
    include: {
      impacts: {
        include: {
          userAttribute: {
            include: {
              attributeDefinition: true,
            },
          },
        },
      },
    },
    orderBy: { occurredAt: "desc" },
  });

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    notes: event.notes,
    eventType: event.eventType,
    intensity: event.intensity,
    occurredAt: event.occurredAt,
    impacts: event.impacts.map((impact) => ({
      userAttributeId: impact.userAttributeId,
      attributeName: impact.userAttribute.attributeDefinition.name,
      attributeSlug: impact.userAttribute.attributeDefinition.slug,
      deltaCurrent: decimalToNumber(impact.deltaCurrent),
      explanation: impact.explanation,
    })),
  }));
}

export type AttributeHistoryView = {
  id: string;
  causeType: string;
  explanation: string;
  changedAt: Date;
  previousCurrent: number;
  nextCurrent: number;
  previousBase: number;
  nextBase: number;
  previousPotential: number;
  nextPotential: number;
};

export async function readAttributeHistory(
  userId: string,
  userAttributeId: string,
): Promise<AttributeHistoryView[]> {
  const logs = await prismaClient.attributeHistoryLog.findMany({
    where: {
      userId,
      userAttributeId,
    },
    orderBy: { changedAt: "desc" },
    take: 50,
  });

  return logs.map((log) => ({
    id: log.id,
    causeType: log.causeType,
    explanation: log.explanation,
    changedAt: log.changedAt,
    previousCurrent: decimalToNumber(log.previousCurrent),
    nextCurrent: decimalToNumber(log.nextCurrent),
    previousBase: decimalToNumber(log.previousBase),
    nextBase: decimalToNumber(log.nextBase),
    previousPotential: decimalToNumber(log.previousPotential),
    nextPotential: decimalToNumber(log.nextPotential),
  }));
}
