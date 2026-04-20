import { prismaClient } from "@/shared/db/prisma-client";
import {
  readCultivationGoal,
  type CultivationGoalView,
} from "@/modules/onboarding/domain/cultivation-goal";

export type UserOnboardingContext = {
  templateKey: string;
  cultivationGoal: CultivationGoalView;
  completedAt: Date;
};

export async function readUserOnboardingContext(
  userId: string,
): Promise<UserOnboardingContext | null> {
  const onboarding = await prismaClient.userOnboarding.findUnique({
    where: { userId },
    include: {
      template: {
        select: {
          key: true,
        },
      },
    },
  });

  if (!onboarding || !onboarding.cultivationGoal) {
    return null;
  }

  return {
    templateKey: onboarding.template.key,
    cultivationGoal: readCultivationGoal(onboarding.cultivationGoal),
    completedAt: onboarding.completedAt,
  };
}
