"use server";

import { redirect } from "next/navigation";
import { completeOnboardingUseCase } from "@/modules/onboarding/application/complete-onboarding.use-case";
import { generateRecommendationsForUser } from "@/modules/recommendations/application/generate-recommendations.use-case";
import { initializeUserLoopForOnboarding } from "@/modules/loops/application/read-user-loop.query";
import { defaultLoopTemplateForGoal } from "@/modules/loops/domain/loop-template";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import { PRODUCT_EVENT_NAME } from "@/modules/analytics/domain/product-event-catalog";
import { CULTIVATION_GOAL_OPTIONS } from "@/modules/onboarding/domain/cultivation-goal";
import { requireAppUser } from "@/shared/auth/route-guards";

export async function completeOnboardingAction(formData: FormData): Promise<void> {
  const user = await requireAppUser();

  // Take the first selected goal as the primary cultivation goal
  const allGoalValues = formData.getAll("cultivationGoal");
  const primaryGoalValue = allGoalValues[0];

  if (typeof primaryGoalValue !== "string" || primaryGoalValue.length === 0) {
    throw new Error("Selecione ao menos um objetivo.");
  }

  const selectedGoal = CULTIVATION_GOAL_OPTIONS.find(
    (option) => option.value === primaryGoalValue,
  );
  if (!selectedGoal) {
    throw new Error("Objetivo inválido.");
  }

  const cultivationGoal = selectedGoal.value;

  // Auto-derive template from the primary goal
  const template = defaultLoopTemplateForGoal(cultivationGoal);

  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.ONBOARDING_CULTIVATION_GOAL_SELECTED,
    userId: user.id,
    properties: { cultivationGoal },
  });

  const result = await completeOnboardingUseCase({
    userId: user.id,
    templateKey: template.key,
    cultivationGoal,
  });

  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.ONBOARDING_GOAL_STEP_COMPLETED,
    userId: user.id,
    properties: { cultivationGoal: result.cultivationGoal },
  });
  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.ONBOARDING_COMPLETED,
    userId: user.id,
    properties: {
      templateKey: result.templateKey,
      templateLabel: result.templateLabel,
      cultivationGoal: result.cultivationGoal,
    },
  });

  await initializeUserLoopForOnboarding({
    userId: user.id,
    cultivationGoal: result.cultivationGoal,
  });
  await generateRecommendationsForUser({ userId: user.id, now: new Date() });

  redirect("/dashboard?activation=1");
}
