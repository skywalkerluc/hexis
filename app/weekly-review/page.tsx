import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { readRetentionView } from "@/modules/retention/application/read-retention.query";
import { runRetentionAction } from "@/modules/retention/presentation/retention.actions";
import { readUserLoopView } from "@/modules/loops/application/read-user-loop.query";
import { updateLoopSettingsAction } from "@/modules/loops/presentation/loop.actions";
import { RecommendationItem } from "@/modules/recommendations/presentation/components/recommendation-item";
import { readActiveRecommendations } from "@/modules/recommendations/application/read-recommendations.query";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import { PRODUCT_EVENT_NAME } from "@/modules/analytics/domain/product-event-catalog";
import { requireOnboardedUser } from "@/shared/auth/route-guards";

async function WeeklyReviewPage() {
  const user = await requireOnboardedUser();
  const [retentionView, recommendations, userLoop] = await Promise.all([
    readRetentionView(user.id, new Date()),
    readActiveRecommendations(user.id),
    readUserLoopView(user.id),
  ]);

  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.WEEKLY_REVIEW_VIEWED,
    userId: user.id,
    properties: {
      source: "weekly_review",
    },
  });
  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.WEEKLY_EXPLANATION_VIEWED,
    userId: user.id,
    properties: {
      improvedCount: retentionView.weeklyReview.improvedCount,
      declinedCount: retentionView.weeklyReview.declinedCount,
    },
  });
  const primaryRecommendation = recommendations[0];
  if (primaryRecommendation) {
    await trackProductEventSafely({
      eventName: PRODUCT_EVENT_NAME.RECOMMENDATION_RATIONALE_VIEWED,
      userId: user.id,
      properties: {
        recommendationId: primaryRecommendation.id,
        surface: "weekly_review",
      },
    });
  }

  return (
    <AppShell
      title="Weekly review"
      eyebrow="Retention"
      currentPath="/weekly-review"
      displayName={user.profile?.displayName ?? user.email}
    >
      <section className="hexis-card mb-6 p-5 sm:p-6">
        <p className="hexis-eyebrow">Weekly focus loop</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Choose one template and one focus for this week. Keep it narrow and repeatable.
        </p>
        <form action={updateLoopSettingsAction} className="mt-4 grid gap-4 lg:grid-cols-2">
          <label>
            <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Template</span>
            <select
              name="templateKey"
              defaultValue={userLoop.template.key}
              className="mt-1.5 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
            >
              {userLoop.templateOptions.map((template) => (
                <option key={template.key} value={template.key}>
                  {template.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{userLoop.template.description}</p>
          </label>
          <label>
            <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Weekly focus</span>
            <select
              name="weeklyFocusAttributeDefinitionId"
              defaultValue={
                userLoop.weeklyFocus?.attributeDefinitionId ??
                userLoop.weeklyFocusOptions[0]?.attributeDefinitionId
              }
              className="mt-1.5 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
            >
              {userLoop.weeklyFocusOptions.map((attribute) => (
                <option key={attribute.attributeDefinitionId} value={attribute.attributeDefinitionId}>
                  {attribute.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{userLoop.template.weeklyPrompt}</p>
          </label>
          <div className="lg:col-span-2">
            <button className="min-h-11 rounded-md border px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
              Save weekly focus
            </button>
          </div>
        </form>
      </section>

      <section className="hexis-card p-5 sm:p-6">
        <p className="hexis-eyebrow">Last 7 days</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Metric label="Improved" value={`${retentionView.weeklyReview.improvedCount}`} />
          <Metric label="Declined" value={`${retentionView.weeklyReview.declinedCount}`} />
          <Metric label="Stable" value={`${retentionView.weeklyReview.stableCount}`} />
        </div>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          {retentionView.weeklyReview.evidenceLoggedCount} evidence log(s), {" "}
          {retentionView.weeklyReview.recommendationUpdates} recommendation update(s), {" "}
          {retentionView.weeklyReview.needsAttentionCount} attribute(s) currently need attention.
        </p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {retentionView.weeklyReview.interpretation}
        </p>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="hexis-card p-4 sm:p-5">
          <p className="hexis-eyebrow">What got better</p>
          {retentionView.weeklyReview.improved.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)]">No clear gain yet this week.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {retentionView.weeklyReview.improved.map((attribute) => (
                <li key={attribute.userAttributeId} className="rounded-md border bg-[var(--color-background)] px-3 py-2">
                  <p className="text-sm font-medium">{attribute.name}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    +{attribute.deltaCurrent.toFixed(2)} current · now {attribute.currentValue.toFixed(1)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="hexis-card p-4 sm:p-5">
          <p className="hexis-eyebrow">What slipped</p>
          {retentionView.weeklyReview.declined.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)]">No meaningful decline detected this week.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {retentionView.weeklyReview.declined.map((attribute) => (
                <li key={attribute.userAttributeId} className="rounded-md border bg-[var(--color-background)] px-3 py-2">
                  <p className="text-sm font-medium">{attribute.name}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {attribute.deltaCurrent.toFixed(2)} current · now {attribute.currentValue.toFixed(1)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="hexis-card mt-6 p-4 sm:p-5">
        <p className="hexis-eyebrow">Suggested focus this week</p>
        {retentionView.suggestedActions.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)]">No high-priority suggestion. Keep a steady maintenance rhythm.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {retentionView.suggestedActions.map((action) => (
              <li key={action.key} className="rounded-md border bg-[var(--color-background)] p-3">
                <p className="text-sm font-medium">{action.title}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{action.description}</p>
                <form action={runRetentionAction} className="mt-2">
                  <input type="hidden" name="kind" value="SUGGESTED_ACTION" />
                  <input type="hidden" name="actionKey" value={action.key} />
                  <input type="hidden" name="path" value={action.href} />
                  <button className="min-h-10 rounded-md border px-3 py-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
                    Open
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="hexis-card mt-6 p-4 sm:p-5">
        <p className="hexis-eyebrow">Current recommendations</p>
        <ul className="mt-3 space-y-3">
          {recommendations.length === 0 ? (
            <li className="text-sm text-[var(--color-muted)]">No active recommendations this week.</li>
          ) : (
            recommendations.slice(0, 2).map((recommendation) => (
              <RecommendationItem
                key={recommendation.id}
                recommendation={recommendation}
                allowActions
                actionSource="return_session"
              />
            ))
          )}
        </ul>
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-[var(--color-background)] p-3">
      <p className="hexis-eyebrow">{label}</p>
      <p className="mt-1.5 text-xl font-semibold">{value}</p>
    </div>
  );
}

export default WeeklyReviewPage;
