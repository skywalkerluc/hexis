"use server";

import { redirect } from "next/navigation";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import { PRODUCT_EVENT_NAME } from "@/modules/analytics/domain/product-event-catalog";
import { requireOnboardedUser } from "@/shared/auth/route-guards";

type RetentionActionKind = "WEEKLY_REVIEW_CTA" | "SUGGESTED_ACTION";

function parsePath(formData: FormData): string {
  const path = formData.get("path");
  if (typeof path !== "string" || path.length === 0) {
    throw new Error("Path is required.");
  }
  if (!path.startsWith("/")) {
    throw new Error("Path must be internal.");
  }
  return path;
}

function parseKind(formData: FormData): RetentionActionKind {
  const kind = formData.get("kind");
  if (kind === "WEEKLY_REVIEW_CTA" || kind === "SUGGESTED_ACTION") {
    return kind;
  }
  throw new Error("Invalid retention action kind.");
}

function parseActionKey(formData: FormData): string {
  const actionKey = formData.get("actionKey");
  if (typeof actionKey !== "string" || actionKey.length === 0) {
    throw new Error("Action key is required.");
  }
  return actionKey;
}

export async function runRetentionAction(formData: FormData): Promise<void> {
  const user = await requireOnboardedUser();
  const path = parsePath(formData);
  const kind = parseKind(formData);
  const actionKey = parseActionKey(formData);

  if (kind === "WEEKLY_REVIEW_CTA") {
    await trackProductEventSafely({
      eventName: PRODUCT_EVENT_NAME.WEEKLY_REVIEW_CTA_CLICKED,
      userId: user.id,
      properties: {
        source: "dashboard",
      },
    });
  }

  if (kind === "SUGGESTED_ACTION") {
    await trackProductEventSafely({
      eventName: PRODUCT_EVENT_NAME.SUGGESTED_ACTION_CLICKED,
      userId: user.id,
      properties: {
        actionKey,
      },
    });
  }

  redirect(path);
}
