import { FeedbackCategory } from "@prisma/client";
import { prismaClient } from "@/shared/db/prisma-client";

export const FEEDBACK_MESSAGE_MIN_LENGTH = 8;
export const FEEDBACK_MESSAGE_MAX_LENGTH = 600;

export const FEEDBACK_CATEGORY = {
  FRICTION: FeedbackCategory.FRICTION,
  IDEA: FeedbackCategory.IDEA,
  BUG: FeedbackCategory.BUG,
} as const;

export type FeedbackCategoryValue =
  (typeof FEEDBACK_CATEGORY)[keyof typeof FEEDBACK_CATEGORY];

export type CreateFeedbackInput = {
  userId: string;
  routePath: string;
  category: FeedbackCategoryValue;
  message: string;
};

function normalizeMessage(message: string): string {
  return message.replace(/\s+/g, " ").trim();
}

function assertRoutePath(value: string): void {
  if (!value.startsWith("/")) {
    throw new Error("Feedback route must be internal.");
  }
}

export function parseFeedbackCategory(value: string): FeedbackCategoryValue {
  if (
    value === FEEDBACK_CATEGORY.FRICTION ||
    value === FEEDBACK_CATEGORY.IDEA ||
    value === FEEDBACK_CATEGORY.BUG
  ) {
    return value;
  }
  throw new Error("Invalid feedback category.");
}

export async function createFeedbackUseCase(input: CreateFeedbackInput): Promise<void> {
  assertRoutePath(input.routePath);
  const message = normalizeMessage(input.message);
  if (message.length < FEEDBACK_MESSAGE_MIN_LENGTH) {
    throw new Error("Feedback message is too short.");
  }
  if (message.length > FEEDBACK_MESSAGE_MAX_LENGTH) {
    throw new Error("Feedback message is too long.");
  }

  await prismaClient.productFeedback.create({
    data: {
      userId: input.userId,
      routePath: input.routePath,
      category: input.category,
      message,
    },
  });
}
