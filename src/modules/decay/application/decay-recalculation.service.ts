import { prismaClient } from "@/shared/db/prisma-client";
import { decimalToNumber, roundScore } from "@/shared/kernel/decimal";
import { fullDaysBetween } from "@/modules/decay/domain/time";
import { deriveAttributeStatus } from "@/modules/attributes/domain/status-policy";
import { computeDecayTransition } from "@/modules/decay/domain/decay-transition";
import { buildHistoryLogEntry } from "@/modules/evidence/domain/history-log.factory";

export type RecalculateDecayInput = {
  userId: string;
  now: Date;
};

export type RecalculateDecayResult = {
  affectedAttributes: number;
  totalCurrentDecay: number;
};

export async function recalculateDecayForUser(input: RecalculateDecayInput): Promise<RecalculateDecayResult> {
  const userAttributes = await prismaClient.userAttribute.findMany({
    where: { userId: input.userId },
    include: {
      attributeDefinition: {
        include: {
          impactRules: true,
        },
      },
    },
  });

  let affectedAttributes = 0;
  let totalCurrentDecay = 0;

  for (const userAttribute of userAttributes) {
    const profile = userAttribute.attributeDefinition.impactRules[0];
    if (!profile) {
      continue;
    }

    const baselineDate = userAttribute.createdAt;
    const lastEventAt = userAttribute.lastEventAt ?? baselineDate;
    const lastDecayCheckAt = userAttribute.lastDecayCheckAt ?? baselineDate;

    const neglectDaysNow = fullDaysBetween(lastEventAt, input.now);
    const neglectDaysBefore = fullDaysBetween(lastEventAt, lastDecayCheckAt);

    const applicableDecayDaysNow = Math.max(0, neglectDaysNow - profile.graceDays);
    const applicableDecayDaysBefore = Math.max(0, neglectDaysBefore - profile.graceDays);
    const newApplicableDays = Math.max(0, applicableDecayDaysNow - applicableDecayDaysBefore);

    const applicableBaseDaysNow = Math.max(0, neglectDaysNow - profile.baseDecayPerDayAfterDays);
    const applicableBaseDaysBefore = Math.max(0, neglectDaysBefore - profile.baseDecayPerDayAfterDays);
    const newApplicableBaseDays = Math.max(0, applicableBaseDaysNow - applicableBaseDaysBefore);

    if (newApplicableDays === 0 && newApplicableBaseDays === 0) {
      await prismaClient.userAttribute.update({
        where: { id: userAttribute.id },
        data: { lastDecayCheckAt: input.now },
      });
      continue;
    }

    const minValue = decimalToNumber(userAttribute.minValue);
    const maxValue = decimalToNumber(userAttribute.maxValue);
    const currentValue = decimalToNumber(userAttribute.currentValue);
    const baseValue = decimalToNumber(userAttribute.baseValue);
    const potentialValue = decimalToNumber(userAttribute.potentialValue);

    const transition = computeDecayTransition({
      minValue,
      maxValue,
      currentValue,
      baseValue,
      potentialValue,
      floorRatio: decimalToNumber(profile.floorRatio),
      decayPerDay: decimalToNumber(profile.decayPerDay),
      baseDecayPerDay: decimalToNumber(profile.baseDecayPerDay),
      newApplicableCurrentDays: newApplicableDays,
      newApplicableBaseDays,
    });

    await prismaClient.$transaction([
      prismaClient.userAttribute.update({
        where: { id: userAttribute.id },
        data: {
          currentValue: transition.nextCurrent,
          baseValue: transition.nextBase,
          potentialValue: transition.nextPotential,
          status: deriveAttributeStatus(transition.nextCurrent, transition.nextBase, maxValue),
          lastDecayCheckAt: input.now,
        },
      }),
      prismaClient.attributeHistoryLog.create({
        data: buildHistoryLogEntry({
          userId: input.userId,
          userAttributeId: userAttribute.id,
          causeType: "DECAY",
          causeReferenceId: null,
          explanation: `Decay recalculation applied after ${neglectDaysNow} day(s) since last event.`,
          previousCurrent: currentValue,
          nextCurrent: transition.nextCurrent,
          previousBase: baseValue,
          nextBase: transition.nextBase,
          previousPotential: potentialValue,
          nextPotential: transition.nextPotential,
          changedAt: input.now,
        }),
      }),
    ]);

    affectedAttributes += 1;
    totalCurrentDecay += transition.currentDecayApplied;
  }

  return { affectedAttributes, totalCurrentDecay: roundScore(totalCurrentDecay) };
}
