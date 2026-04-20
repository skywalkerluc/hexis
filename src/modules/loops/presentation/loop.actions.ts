"use server";

import { revalidatePath } from "next/cache";
import {
  readLoopTemplateByKey,
  type LoopTemplateKey,
} from "@/modules/loops/domain/loop-template";
import { updateUserLoop } from "@/modules/loops/application/read-user-loop.query";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import { PRODUCT_EVENT_NAME } from "@/modules/analytics/domain/product-event-catalog";
import { requireOnboardedUser } from "@/shared/auth/route-guards";

function parseTemplateKey(formData: FormData): LoopTemplateKey {
  const value = formData.get("templateKey");
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("Template key is required.");
  }
  const template = readLoopTemplateByKey(value);
  return template.key;
}

function parseWeeklyFocusAttributeDefinitionId(formData: FormData): string {
  const value = formData.get("weeklyFocusAttributeDefinitionId");
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("Weekly focus attribute is required.");
  }
  return value;
}

export async function updateLoopSettingsAction(formData: FormData): Promise<void> {
  const user = await requireOnboardedUser();
  const templateKey = parseTemplateKey(formData);
  const weeklyFocusAttributeDefinitionId =
    parseWeeklyFocusAttributeDefinitionId(formData);

  const result = await updateUserLoop({
    userId: user.id,
    templateKey,
    weeklyFocusAttributeDefinitionId,
    now: new Date(),
  });

  if (result.templateChanged) {
    await trackProductEventSafely({
      eventName: PRODUCT_EVENT_NAME.TEMPLATE_SELECTED,
      userId: user.id,
      properties: {
        templateKey: result.nextTemplateKey,
      },
    });
  }

  if (result.weeklyFocusChanged) {
    if (result.previousWeeklyFocusAttributeDefinitionId === null) {
      await trackProductEventSafely({
        eventName: PRODUCT_EVENT_NAME.WEEKLY_FOCUS_SET,
        userId: user.id,
        properties: {
          templateKey: result.nextTemplateKey,
          weeklyFocusAttributeDefinitionId:
            result.nextWeeklyFocusAttributeDefinitionId,
        },
      });
    } else {
      await trackProductEventSafely({
        eventName: PRODUCT_EVENT_NAME.WEEKLY_FOCUS_CHANGED,
        userId: user.id,
        properties: {
          templateKey: result.nextTemplateKey,
          weeklyFocusAttributeDefinitionId:
            result.nextWeeklyFocusAttributeDefinitionId,
        },
      });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/weekly-review");
  revalidatePath("/log");
}
