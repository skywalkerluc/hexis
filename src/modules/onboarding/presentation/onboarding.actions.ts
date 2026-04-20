"use server";

import { redirect } from "next/navigation";
import { completeOnboardingUseCase } from "@/modules/onboarding/application/complete-onboarding.use-case";
import { requireAppUser } from "@/shared/auth/route-guards";

export async function completeOnboardingAction(formData: FormData): Promise<void> {
  const user = await requireAppUser();
  const templateKeyValue = formData.get("templateKey");
  if (typeof templateKeyValue !== "string" || templateKeyValue.length === 0) {
    throw new Error("Template key missing");
  }

  await completeOnboardingUseCase({
    userId: user.id,
    templateKey: templateKeyValue,
  });

  redirect("/dashboard");
}
