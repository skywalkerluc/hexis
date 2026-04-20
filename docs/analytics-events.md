# Hexis Product Analytics Event Catalog

This catalog defines stable, product-level analytics events for Hexis v1 roadmap.

## Principles
- Product events are emitted through the analytics module only.
- Event names are stable and intentional.
- Properties are minimal and decision-oriented.
- No sensitive raw content (for example notes text or passwords) is tracked.

## Event list

| Event name | Trigger | Key properties |
| --- | --- | --- |
| `auth.signup_completed` | Signup succeeds | `entryPoint` |
| `onboarding.started` | Onboarding page is opened by a non-onboarded user | `entryPoint` |
| `onboarding.cultivation_goal_selected` | User selects a cultivation goal during onboarding submit | `cultivationGoal` |
| `onboarding.goal_step_completed` | Goal step is completed as part of onboarding completion flow | `cultivationGoal` |
| `onboarding.completed` | Onboarding completion succeeds | `templateKey`, `templateLabel`, `cultivationGoal` |
| `loop.template_selected` | User selects a goal-based template in weekly loop settings | `templateKey` |
| `loop.weekly_focus_set` | User sets weekly focus for the first time | `templateKey`, `weeklyFocusAttributeDefinitionId` |
| `loop.weekly_focus_changed` | User changes weekly focus after initial setup | `templateKey`, `weeklyFocusAttributeDefinitionId` |
| `loop.weekly_focus_suggested_action_clicked` | User clicks a weekly-focus suggested action | `actionKey` |
| `loop.template_influenced_recommendation_shown` | Template-influenced recommendation is shown as primary | `recommendationId`, `templateKey` |
| `feedback.opened` | In-product feedback surface is opened | `routePath` |
| `feedback.submitted` | Feedback form is submitted successfully | `category`, `routePath` |
| `landing.cta_clicked` | Public landing CTA is used | `target` (`login` or `signup`) |
| `evidence.first_log_created` | First evidence event persisted for user | `eventType`, `intensity`, `impactedAttributeCount` |
| `evidence.second_log_created` | Second evidence event persisted for user | `eventType`, `intensity`, `impactedAttributeCount` |
| `recommendation.applied` | Recommendation apply action succeeds | `recommendationId` |
| `recommendation.dismissed` | Recommendation dismiss action succeeds | `recommendationId` |
| `attribute.detail_viewed` | Attribute detail page is opened | `attributeSlug` |
| `dashboard.viewed` | Dashboard page is opened | `source` |
| `log.page_opened` | Log page is opened | `source` (`app`, `onboarding_activation`, `dashboard_goal`) |
| `log.submit_failed` | Log submit fails | `reason` (`validation`, `invalid_occurred_at`, `server`) |
| `log.submit_succeeded` | Log submit succeeds | `eventType`, `intensity`, `impactedAttributeCount` |
| `log.started_from_guided_cta` | First log session starts from guided activation CTA | `source`, `cultivationGoal` |
| `recommendation.goal_aware_shown` | Goal-aligned recommendation is shown in activation state | `recommendationId`, `cultivationGoal` |
| `retention.return_summary_viewed` | “Since your last visit” summary is rendered | `isReturningUser`, `improvedCount`, `declinedCount`, `needsAttentionCount` |
| `retention.weekly_review_cta_clicked` | Weekly review CTA is clicked from dashboard | `source` |
| `review.weekly_viewed` | Weekly review page is viewed | `source` |
| `retention.suggested_action_clicked` | A retention suggested action is clicked | `actionKey` |
| `recommendation.return_session_applied` | Recommendation is applied from return-session context | `recommendationId` |
| `recommendation.return_session_dismissed` | Recommendation is dismissed from return-session context | `recommendationId` |
| `recommendation.rationale_viewed` | Recommendation rationale is shown in a key surface | `recommendationId`, `surface` |
| `attribute.explanation_viewed` | Attribute explanation section is viewed | `attributeSlug`, `state` |
| `review.explanation_viewed` | Weekly explanation block is viewed | `improvedCount`, `declinedCount` |
| `auth.return_session_after_signup` | Login succeeds for users returning after signup-age threshold | `daysSinceSignup` |

## Storage
Analytics events are persisted in `ProductAnalyticsEvent` with:
- optional `userId`
- `eventName`
- `properties` (JSON)
- `occurredAt`

This supports funnel and behavior queries with SQL or BI tooling without adding external vendor lock-in in Sprint 1.
