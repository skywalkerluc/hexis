# Hexis v1 Readiness Checklist

Practical checklist for deciding when Hexis is ready for broader intentional exposure.

## Product
- [x] Core attribute model is explainable in-product (current/base/potential).
- [x] Evidence logging is real and persists domain impacts/history.
- [x] Recommendation lifecycle supports active, dismissed, applied, expired.
- [x] In-product feedback capture exists and links feedback to route context.
- [ ] Weekly review interpretation copy should be reviewed with 5+ real user sessions.

## UX Quality
- [x] Dashboard gives a clear primary next action.
- [x] Log flow includes recoverable validation and concise success confirmation.
- [x] Mobile usability is acceptable on dashboard, log, and attribute detail.
- [ ] Run one final copy QA pass for onboarding, weekly review, and settings.

## Analytics & Product Learning
- [x] Funnel events for signup, onboarding, first/second log, and recommendation actions.
- [x] Retention events for return summary and weekly review.
- [x] Loop events for template/focus adoption and influenced recommendations.
- [x] Readiness events for landing CTA and feedback capture.
- [ ] Define first v1 decision dashboard queries (activation and return cohorts).

## Operational Basics
- [x] Prisma migrations are present and replayable.
- [x] DB-backed integration tests run against real PostgreSQL.
- [x] Daily decay job has lease + heartbeat safety foundations.
- [x] Basic app-level error fallback exists.
- [ ] Add documented runbook for daily job failure recovery.

## Public/Legal Basics
- [ ] Add explicit privacy policy page for public testing.
- [ ] Add explicit terms-for-testing page.
- [x] Landing entry experience is clear for first-time users.

## Release Gate (minimum)
- [ ] 10+ real user sessions completed with feedback reviewed.
- [ ] Activation baseline measured (onboarding complete, first log, second log).
- [ ] Retention baseline measured (7-day return and weekly review usage).
- [ ] Open P0/P1 issues from feedback addressed.
