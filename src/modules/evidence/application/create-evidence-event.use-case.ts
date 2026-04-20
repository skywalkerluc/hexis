import { z } from "zod";
import type { EvidenceEventType, EvidenceIntensity } from "@prisma/client";
import { prismaClient } from "@/shared/db/prisma-client";
import { decimalToNumber } from "@/shared/kernel/decimal";
import { deriveAttributeStatus } from "@/modules/attributes/domain/status-policy";
import { computeEventImpact } from "@/modules/evidence/application/compute-event-impact";
import { buildHistoryLogEntry } from "@/modules/evidence/domain/history-log.factory";

const eventInputSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(3).max(160),
  notes: z.string().max(2000).optional(),
  eventType: z.enum(["TRAINING", "PRACTICE", "ROUTINE", "ACHIEVEMENT", "RECOVERY"]),
  intensity: z.enum(["LIGHT", "MODERATE", "INTENSE"]),
  occurredAt: z.date(),
  userAttributeIds: z.array(z.string().min(1)).min(1),
});

export type CreateEvidenceEventInput = z.infer<typeof eventInputSchema>;

export type CreateEvidenceEventResult = {
  eventId: string;
};

export async function createEvidenceEventUseCase(
  input: CreateEvidenceEventInput,
): Promise<CreateEvidenceEventResult> {
  const parsed = eventInputSchema.parse(input);
  const uniqueAttributeIds = [...new Set(parsed.userAttributeIds)];

  const event = await prismaClient.$transaction(async (transactionClient) => {
    const selectedAttributes = await transactionClient.userAttribute.findMany({
      where: {
        id: { in: uniqueAttributeIds },
        userId: parsed.userId,
      },
      include: {
        attributeDefinition: {
          include: {
            impactRules: true,
          },
        },
      },
    });

    if (selectedAttributes.length !== uniqueAttributeIds.length) {
      throw new Error("Some selected attributes do not belong to this user.");
    }

    const createdEvent = await transactionClient.evidenceEvent.create({
      data: {
        userId: parsed.userId,
        title: parsed.title,
        notes: parsed.notes ?? null,
        eventType: parsed.eventType as EvidenceEventType,
        intensity: parsed.intensity as EvidenceIntensity,
        occurredAt: parsed.occurredAt,
      },
    });

    for (const userAttribute of selectedAttributes) {
      const profile = userAttribute.attributeDefinition.impactRules[0];
      if (!profile) {
        throw new Error(
          `Missing decay profile for attribute ${userAttribute.attributeDefinition.slug}`,
        );
      }

      const currentValue = decimalToNumber(userAttribute.currentValue);
      const baseValue = decimalToNumber(userAttribute.baseValue);
      const potentialValue = decimalToNumber(userAttribute.potentialValue);
      const minValue = decimalToNumber(userAttribute.minValue);
      const maxValue = decimalToNumber(userAttribute.maxValue);

      const impact = computeEventImpact({
        attributeSlug: userAttribute.attributeDefinition.slug,
        eventType: parsed.eventType,
        intensity: parsed.intensity,
        selectedAttributeCount: selectedAttributes.length,
        maintenanceBoostCurrent: decimalToNumber(profile.maintenanceBoostCurrent),
        maintenanceBoostBase: decimalToNumber(profile.maintenanceBoostBase),
        maintenanceBoostPotential: decimalToNumber(profile.maintenanceBoostPotential),
        recoveryBoostCurrent: decimalToNumber(profile.recoveryBoostCurrent),
        recoveryBoostBase: decimalToNumber(profile.recoveryBoostBase),
        recoveryBoostPotential: decimalToNumber(profile.recoveryBoostPotential),
        minValue,
        maxValue,
        currentValue,
        baseValue,
        potentialValue,
      });

      await transactionClient.userAttribute.update({
        where: { id: userAttribute.id },
        data: {
          currentValue: impact.nextCurrent,
          baseValue: impact.nextBase,
          potentialValue: impact.nextPotential,
          lastEventAt: parsed.occurredAt,
          status: deriveAttributeStatus(impact.nextCurrent, impact.nextBase, maxValue),
          consistencyScore: {
            increment: impact.deltaCurrent > 0 ? 1 : 0,
          },
        },
      });

      await transactionClient.evidenceEventImpact.create({
        data: {
          eventId: createdEvent.id,
          userAttributeId: userAttribute.id,
          deltaCurrent: impact.deltaCurrent,
          deltaBase: impact.deltaBase,
          deltaPotential: impact.deltaPotential,
          explanation: impact.explanation,
        },
      });

      await transactionClient.attributeHistoryLog.create({
        data: buildHistoryLogEntry({
          userId: parsed.userId,
          userAttributeId: userAttribute.id,
          causeType: "EVENT",
          causeReferenceId: createdEvent.id,
          explanation: impact.explanation,
          previousCurrent: currentValue,
          nextCurrent: impact.nextCurrent,
          previousBase: baseValue,
          nextBase: impact.nextBase,
          previousPotential: potentialValue,
          nextPotential: impact.nextPotential,
          changedAt: parsed.occurredAt,
        }),
      });
    }

    return createdEvent;
  });

  return { eventId: event.id };
}
