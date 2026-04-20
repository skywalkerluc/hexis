"use server";

import { redirect } from "next/navigation";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import { PRODUCT_EVENT_NAME } from "@/modules/analytics/domain/product-event-catalog";

type LandingTarget = "login" | "signup";

function parseTarget(formData: FormData): LandingTarget {
  const value = formData.get("target");
  if (value === "login" || value === "signup") {
    return value;
  }
  throw new Error("Invalid landing target.");
}

export async function landingCtaAction(formData: FormData): Promise<void> {
  const target = parseTarget(formData);
  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.LANDING_CTA_CLICKED,
    properties: {
      target,
    },
  });

  redirect(target === "signup" ? "/signup" : "/login");
}
