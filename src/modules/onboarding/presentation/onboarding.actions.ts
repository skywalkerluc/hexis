"use server";

import { redirect } from "next/navigation";
import { completeOnboardingUseCase } from "@/modules/onboarding/application/complete-onboarding.use-case";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import { PRODUCT_EVENT_NAME } from "@/modules/analytics/domain/product-event-catalog";
import { requireAppUser } from "@/shared/auth/route-guards";

export async function completeOnboardingAction(formData: FormData): Promise<void> {
  const user = await requireAppUser();
  const templateKeyValue = formData.get("templateKey");
  if (typeof templateKeyValue !== "string" || templateKeyValue.length === 0) {
    throw new Error("Template key missing");
  }

  const result = await completeOnboardingUseCase({
    userId: user.id,
    templateKey: templateKeyValue,
  });
  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.ONBOARDING_COMPLETED,
    userId: user.id,
    properties: {
      templateKey: result.templateKey,
      templateLabel: result.templateLabel,
    },
  });

  redirect("/dashboard");
}
