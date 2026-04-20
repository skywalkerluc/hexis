"use server";

import { revalidatePath } from "next/cache";
import {
  applyRecommendationUseCase,
  dismissRecommendationUseCase,
} from "@/modules/recommendations/application/update-recommendation-status.use-case";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import { PRODUCT_EVENT_NAME } from "@/modules/analytics/domain/product-event-catalog";
import { requireOnboardedUser } from "@/shared/auth/route-guards";

function parseRecommendationId(formData: FormData): string {
  const recommendationId = formData.get("recommendationId");
  if (typeof recommendationId !== "string" || recommendationId.length === 0) {
    throw new Error("Recommendation id is required.");
  }
  return recommendationId;
}

function parseSource(formData: FormData): "default" | "return_session" {
  const source = formData.get("source");
  if (source === "return_session") {
    return "return_session";
  }
  return "default";
}

function revalidateRecommendationSurfaces(): void {
  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/attributes");
  revalidatePath("/weekly-review");
}

export async function dismissRecommendationAction(formData: FormData): Promise<void> {
  const user = await requireOnboardedUser();
  const recommendationId = parseRecommendationId(formData);
  const source = parseSource(formData);

  await dismissRecommendationUseCase({
    userId: user.id,
    recommendationId,
    now: new Date(),
  });
  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.RECOMMENDATION_DISMISSED,
    userId: user.id,
    properties: { recommendationId },
  });
  if (source === "return_session") {
    await trackProductEventSafely({
      eventName: PRODUCT_EVENT_NAME.RETURN_SESSION_RECOMMENDATION_DISMISSED,
      userId: user.id,
      properties: { recommendationId },
    });
  }

  revalidateRecommendationSurfaces();
}

export async function applyRecommendationAction(formData: FormData): Promise<void> {
  const user = await requireOnboardedUser();
  const recommendationId = parseRecommendationId(formData);
  const source = parseSource(formData);

  await applyRecommendationUseCase({
    userId: user.id,
    recommendationId,
    now: new Date(),
  });
  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.RECOMMENDATION_APPLIED,
    userId: user.id,
    properties: { recommendationId },
  });
  if (source === "return_session") {
    await trackProductEventSafely({
      eventName: PRODUCT_EVENT_NAME.RETURN_SESSION_RECOMMENDATION_APPLIED,
      userId: user.id,
      properties: { recommendationId },
    });
  }

  revalidateRecommendationSurfaces();
}
