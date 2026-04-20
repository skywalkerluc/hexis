"use server";

import { revalidatePath } from "next/cache";
import {
  applyRecommendationUseCase,
  dismissRecommendationUseCase,
} from "@/modules/recommendations/application/update-recommendation-status.use-case";
import { requireOnboardedUser } from "@/shared/auth/route-guards";

function parseRecommendationId(formData: FormData): string {
  const recommendationId = formData.get("recommendationId");
  if (typeof recommendationId !== "string" || recommendationId.length === 0) {
    throw new Error("Recommendation id is required.");
  }
  return recommendationId;
}

function revalidateRecommendationSurfaces(): void {
  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/attributes");
}

export async function dismissRecommendationAction(formData: FormData): Promise<void> {
  const user = await requireOnboardedUser();
  const recommendationId = parseRecommendationId(formData);

  await dismissRecommendationUseCase({
    userId: user.id,
    recommendationId,
    now: new Date(),
  });

  revalidateRecommendationSurfaces();
}

export async function applyRecommendationAction(formData: FormData): Promise<void> {
  const user = await requireOnboardedUser();
  const recommendationId = parseRecommendationId(formData);

  await applyRecommendationUseCase({
    userId: user.id,
    recommendationId,
    now: new Date(),
  });

  revalidateRecommendationSurfaces();
}
