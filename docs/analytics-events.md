# Hexis Product Analytics Event Catalog (Sprint 1)

This catalog defines stable, product-level analytics events for Hexis v1 roadmap Sprint 1.

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
| `onboarding.completed` | Onboarding completion succeeds | `templateKey`, `templateLabel` |
| `evidence.first_log_created` | First evidence event persisted for user | `eventType`, `intensity`, `impactedAttributeCount` |
| `evidence.second_log_created` | Second evidence event persisted for user | `eventType`, `intensity`, `impactedAttributeCount` |
| `recommendation.applied` | Recommendation apply action succeeds | `recommendationId` |
| `recommendation.dismissed` | Recommendation dismiss action succeeds | `recommendationId` |
| `attribute.detail_viewed` | Attribute detail page is opened | `attributeSlug` |
| `dashboard.viewed` | Dashboard page is opened | `source` |
| `log.page_opened` | Log page is opened | `source` |
| `log.submit_failed` | Log submit fails | `reason` (`validation`, `invalid_occurred_at`, `server`) |
| `log.submit_succeeded` | Log submit succeeds | `eventType`, `intensity`, `impactedAttributeCount` |
| `auth.return_session_after_signup` | Login succeeds for users returning after signup-age threshold | `daysSinceSignup` |
| `review.weekly_viewed` | Reserved for Sprint 3 weekly review surface | `source` |

## Storage
Analytics events are persisted in `ProductAnalyticsEvent` with:
- optional `userId`
- `eventName`
- `properties` (JSON)
- `occurredAt`

This supports funnel and behavior queries with SQL or BI tooling without adding external vendor lock-in in Sprint 1.
