"use server";

import { requireAppUser } from "@/shared/auth/route-guards";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import { PRODUCT_EVENT_NAME } from "@/modules/analytics/domain/product-event-catalog";
import {
  createFeedbackUseCase,
  FEEDBACK_CATEGORY,
  FEEDBACK_MESSAGE_MAX_LENGTH,
  FEEDBACK_MESSAGE_MIN_LENGTH,
  parseFeedbackCategory,
} from "@/modules/feedback/application/create-feedback.use-case";

export type FeedbackActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

function readTextField(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function normalizeRoutePath(value: string): string {
  if (!value.startsWith("/")) {
    return "/dashboard";
  }
  return value;
}

const SUCCESS_STATE: FeedbackActionState = {
  status: "success",
  message: "Thanks. Your feedback was saved and linked to this surface.",
};

export async function submitFeedbackAction(
  _previousState: FeedbackActionState,
  formData: FormData,
): Promise<FeedbackActionState> {
  const user = await requireAppUser();
  const categoryValue = readTextField(formData, "category");
  const routePath = normalizeRoutePath(readTextField(formData, "routePath"));
  const message = readTextField(formData, "message");

  if (message.length < FEEDBACK_MESSAGE_MIN_LENGTH) {
    return {
      status: "error",
      message: `Write at least ${FEEDBACK_MESSAGE_MIN_LENGTH} characters so we can act on it.`,
    };
  }

  if (message.length > FEEDBACK_MESSAGE_MAX_LENGTH) {
    return {
      status: "error",
      message: `Keep feedback under ${FEEDBACK_MESSAGE_MAX_LENGTH} characters.`,
    };
  }

  try {
    const category = parseFeedbackCategory(categoryValue);

    await createFeedbackUseCase({
      userId: user.id,
      routePath,
      category,
      message,
    });

    await trackProductEventSafely({
      eventName: PRODUCT_EVENT_NAME.FEEDBACK_SUBMITTED,
      userId: user.id,
      properties: {
        category,
        routePath,
      },
    });

    return SUCCESS_STATE;
  } catch {
    return {
      status: "error",
      message: "Feedback could not be saved right now. Please try again.",
    };
  }
}

export const FEEDBACK_INITIAL_STATE: FeedbackActionState = {
  status: "idle",
  message: null,
};

export const FEEDBACK_CATEGORY_OPTIONS: readonly {
  value: (typeof FEEDBACK_CATEGORY)[keyof typeof FEEDBACK_CATEGORY];
  label: string;
}[] = [
  { value: FEEDBACK_CATEGORY.FRICTION, label: "Friction" },
  { value: FEEDBACK_CATEGORY.IDEA, label: "Idea" },
  { value: FEEDBACK_CATEGORY.BUG, label: "Bug" },
] as const;
