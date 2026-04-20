export const PRODUCT_EVENT_NAME = {
  SIGNUP_COMPLETED: "auth.signup_completed",
  ONBOARDING_STARTED: "onboarding.started",
  ONBOARDING_COMPLETED: "onboarding.completed",
  FIRST_EVIDENCE_LOG_CREATED: "evidence.first_log_created",
  SECOND_EVIDENCE_LOG_CREATED: "evidence.second_log_created",
  RECOMMENDATION_APPLIED: "recommendation.applied",
  RECOMMENDATION_DISMISSED: "recommendation.dismissed",
  ATTRIBUTE_DETAIL_VIEWED: "attribute.detail_viewed",
  DASHBOARD_VIEWED: "dashboard.viewed",
  LOG_PAGE_OPENED: "log.page_opened",
  LOG_SUBMIT_FAILED: "log.submit_failed",
  LOG_SUBMIT_SUCCEEDED: "log.submit_succeeded",
  RETURN_SESSION_AFTER_SIGNUP: "auth.return_session_after_signup",
  WEEKLY_REVIEW_VIEWED: "review.weekly_viewed",
} as const;

export type ProductEventName =
  (typeof PRODUCT_EVENT_NAME)[keyof typeof PRODUCT_EVENT_NAME];

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type ProductEventPropertyMap = {
  [PRODUCT_EVENT_NAME.SIGNUP_COMPLETED]: {
    entryPoint: "signup_form";
  };
  [PRODUCT_EVENT_NAME.ONBOARDING_STARTED]: {
    entryPoint: "onboarding_page";
  };
  [PRODUCT_EVENT_NAME.ONBOARDING_COMPLETED]: {
    templateKey: string;
    templateLabel: string;
  };
  [PRODUCT_EVENT_NAME.FIRST_EVIDENCE_LOG_CREATED]: {
    eventType: string;
    intensity: string;
    impactedAttributeCount: number;
  };
  [PRODUCT_EVENT_NAME.SECOND_EVIDENCE_LOG_CREATED]: {
    eventType: string;
    intensity: string;
    impactedAttributeCount: number;
  };
  [PRODUCT_EVENT_NAME.RECOMMENDATION_APPLIED]: {
    recommendationId: string;
  };
  [PRODUCT_EVENT_NAME.RECOMMENDATION_DISMISSED]: {
    recommendationId: string;
  };
  [PRODUCT_EVENT_NAME.ATTRIBUTE_DETAIL_VIEWED]: {
    attributeSlug: string;
  };
  [PRODUCT_EVENT_NAME.DASHBOARD_VIEWED]: {
    source: "app";
  };
  [PRODUCT_EVENT_NAME.LOG_PAGE_OPENED]: {
    source: "app";
  };
  [PRODUCT_EVENT_NAME.LOG_SUBMIT_FAILED]: {
    reason: "validation" | "invalid_occurred_at" | "server";
  };
  [PRODUCT_EVENT_NAME.LOG_SUBMIT_SUCCEEDED]: {
    eventType: string;
    intensity: string;
    impactedAttributeCount: number;
  };
  [PRODUCT_EVENT_NAME.RETURN_SESSION_AFTER_SIGNUP]: {
    daysSinceSignup: number;
  };
  [PRODUCT_EVENT_NAME.WEEKLY_REVIEW_VIEWED]: {
    source: "dashboard" | "weekly_review";
  };
};

export type TrackProductEventInput<TEventName extends ProductEventName> = {
  eventName: TEventName;
  userId?: string;
  properties: ProductEventPropertyMap[TEventName];
  occurredAt?: Date;
};

export const RETURN_SESSION_MIN_HOURS_AFTER_SIGNUP = 6;
