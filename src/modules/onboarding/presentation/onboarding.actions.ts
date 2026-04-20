"use server";

import { redirect } from "next/navigation";
import { completeOnboardingUseCase } from "@/modules/onboarding/application/complete-onboarding.use-case";
import { generateRecommendationsForUser } from "@/modules/recommendations/application/generate-recommendations.use-case";
import { initializeUserLoopForOnboarding } from "@/modules/loops/application/read-user-loop.query";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import { PRODUCT_EVENT_NAME } from "@/modules/analytics/domain/product-event-catalog";
import {
  CULTIVATION_GOAL_OPTIONS,
} from "@/modules/onboarding/domain/cultivation-goal";
import { requireAppUser } from "@/shared/auth/route-guards";

export async function completeOnboardingAction(formData: FormData): Promise<void> {
  const user = await requireAppUser();
  const templateKeyValue = formData.get("templateKey");
  const cultivationGoalValue = formData.get("cultivationGoal");
  if (typeof templateKeyValue !== "string" || templateKeyValue.length === 0) {
    throw new Error("Template key missing");
  }
  if (typeof cultivationGoalValue !== "string" || cultivationGoalValue.length === 0) {
    throw new Error("Cultivation goal is required.");
  }
  const selectedGoal = CULTIVATION_GOAL_OPTIONS.find(
    (option) => option.value === cultivationGoalValue,
  );
  if (!selectedGoal) {
    throw new Error("Cultivation goal is invalid.");
  }
  const cultivationGoal = selectedGoal.value;
  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.ONBOARDING_CULTIVATION_GOAL_SELECTED,
    userId: user.id,
    properties: {
      cultivationGoal,
    },
  });

  const result = await completeOnboardingUseCase({
    userId: user.id,
    templateKey: templateKeyValue,
    cultivationGoal,
  });
  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.ONBOARDING_GOAL_STEP_COMPLETED,
    userId: user.id,
    properties: {
      cultivationGoal: result.cultivationGoal,
    },
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
  await generateRecommendationsForUser({
    userId: user.id,
    now: new Date(),
  });

  redirect("/dashboard?activation=1");
}
