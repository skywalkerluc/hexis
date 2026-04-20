export const PRODUCT_EVENT_NAME = {
  SIGNUP_COMPLETED: "auth.signup_completed",
  ONBOARDING_STARTED: "onboarding.started",
  ONBOARDING_CULTIVATION_GOAL_SELECTED: "onboarding.cultivation_goal_selected",
  ONBOARDING_GOAL_STEP_COMPLETED: "onboarding.goal_step_completed",
  ONBOARDING_COMPLETED: "onboarding.completed",
  TEMPLATE_SELECTED: "loop.template_selected",
  WEEKLY_FOCUS_SET: "loop.weekly_focus_set",
  WEEKLY_FOCUS_CHANGED: "loop.weekly_focus_changed",
  WEEKLY_FOCUS_SUGGESTED_ACTION_CLICKED: "loop.weekly_focus_suggested_action_clicked",
  TEMPLATE_INFLUENCED_RECOMMENDATION_SHOWN: "loop.template_influenced_recommendation_shown",
  FEEDBACK_OPENED: "feedback.opened",
  FEEDBACK_SUBMITTED: "feedback.submitted",
  LANDING_CTA_CLICKED: "landing.cta_clicked",
  FIRST_EVIDENCE_LOG_CREATED: "evidence.first_log_created",
  SECOND_EVIDENCE_LOG_CREATED: "evidence.second_log_created",
  RECOMMENDATION_APPLIED: "recommendation.applied",
  RECOMMENDATION_DISMISSED: "recommendation.dismissed",
  ATTRIBUTE_DETAIL_VIEWED: "attribute.detail_viewed",
  DASHBOARD_VIEWED: "dashboard.viewed",
  LOG_PAGE_OPENED: "log.page_opened",
  LOG_SUBMIT_FAILED: "log.submit_failed",
  LOG_SUBMIT_SUCCEEDED: "log.submit_succeeded",
  LOG_STARTED_FROM_GUIDED_CTA: "log.started_from_guided_cta",
  GOAL_AWARE_RECOMMENDATION_SHOWN: "recommendation.goal_aware_shown",
  RETURN_SUMMARY_VIEWED: "retention.return_summary_viewed",
  WEEKLY_REVIEW_CTA_CLICKED: "retention.weekly_review_cta_clicked",
  SUGGESTED_ACTION_CLICKED: "retention.suggested_action_clicked",
  RETURN_SESSION_RECOMMENDATION_APPLIED: "recommendation.return_session_applied",
  RETURN_SESSION_RECOMMENDATION_DISMISSED: "recommendation.return_session_dismissed",
  RECOMMENDATION_RATIONALE_VIEWED: "recommendation.rationale_viewed",
  ATTRIBUTE_EXPLANATION_VIEWED: "attribute.explanation_viewed",
  WEEKLY_EXPLANATION_VIEWED: "review.explanation_viewed",
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
  [PRODUCT_EVENT_NAME.ONBOARDING_CULTIVATION_GOAL_SELECTED]: {
    cultivationGoal: string;
  };
  [PRODUCT_EVENT_NAME.ONBOARDING_GOAL_STEP_COMPLETED]: {
    cultivationGoal: string;
  };
  [PRODUCT_EVENT_NAME.ONBOARDING_COMPLETED]: {
    templateKey: string;
    templateLabel: string;
    cultivationGoal: string;
  };
  [PRODUCT_EVENT_NAME.TEMPLATE_SELECTED]: {
    templateKey: string;
  };
  [PRODUCT_EVENT_NAME.WEEKLY_FOCUS_SET]: {
    templateKey: string;
    weeklyFocusAttributeDefinitionId: string;
  };
  [PRODUCT_EVENT_NAME.WEEKLY_FOCUS_CHANGED]: {
    templateKey: string;
    weeklyFocusAttributeDefinitionId: string;
  };
  [PRODUCT_EVENT_NAME.WEEKLY_FOCUS_SUGGESTED_ACTION_CLICKED]: {
    actionKey: string;
  };
  [PRODUCT_EVENT_NAME.TEMPLATE_INFLUENCED_RECOMMENDATION_SHOWN]: {
    recommendationId: string;
    templateKey: string;
  };
  [PRODUCT_EVENT_NAME.FEEDBACK_OPENED]: {
    routePath: string;
  };
  [PRODUCT_EVENT_NAME.FEEDBACK_SUBMITTED]: {
    category: "FRICTION" | "IDEA" | "BUG";
    routePath: string;
  };
  [PRODUCT_EVENT_NAME.LANDING_CTA_CLICKED]: {
    target: "login" | "signup";
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
    source: "app" | "onboarding_activation" | "dashboard_goal";
  };
  [PRODUCT_EVENT_NAME.LOG_SUBMIT_FAILED]: {
    reason: "validation" | "invalid_occurred_at" | "server";
  };
  [PRODUCT_EVENT_NAME.LOG_SUBMIT_SUCCEEDED]: {
    eventType: string;
    intensity: string;
    impactedAttributeCount: number;
  };
  [PRODUCT_EVENT_NAME.LOG_STARTED_FROM_GUIDED_CTA]: {
    source: "onboarding_activation" | "dashboard_goal";
    cultivationGoal: string;
  };
  [PRODUCT_EVENT_NAME.GOAL_AWARE_RECOMMENDATION_SHOWN]: {
    recommendationId: string;
    cultivationGoal: string;
  };
  [PRODUCT_EVENT_NAME.RETURN_SUMMARY_VIEWED]: {
    isReturningUser: boolean;
    improvedCount: number;
    declinedCount: number;
    needsAttentionCount: number;
  };
  [PRODUCT_EVENT_NAME.WEEKLY_REVIEW_CTA_CLICKED]: {
    source: "dashboard";
  };
  [PRODUCT_EVENT_NAME.SUGGESTED_ACTION_CLICKED]: {
    actionKey: string;
  };
  [PRODUCT_EVENT_NAME.RETURN_SESSION_RECOMMENDATION_APPLIED]: {
    recommendationId: string;
  };
  [PRODUCT_EVENT_NAME.RETURN_SESSION_RECOMMENDATION_DISMISSED]: {
    recommendationId: string;
  };
  [PRODUCT_EVENT_NAME.RECOMMENDATION_RATIONALE_VIEWED]: {
    recommendationId: string;
    surface: "dashboard" | "weekly_review" | "attribute_detail";
  };
  [PRODUCT_EVENT_NAME.ATTRIBUTE_EXPLANATION_VIEWED]: {
    attributeSlug: string;
    state: "MAINTAINED" | "NEGLECTED" | "RECOVERING" | "MIXED";
  };
  [PRODUCT_EVENT_NAME.WEEKLY_EXPLANATION_VIEWED]: {
    improvedCount: number;
    declinedCount: number;
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
