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
  const primarySuggestedAction = retentionView.suggestedActions[0];
  const weeklyTakeaway = buildWeeklyTakeaway({
    improvedCount: retentionView.weeklyReview.improvedCount,
    declinedCount: retentionView.weeklyReview.declinedCount,
    stableCount: retentionView.weeklyReview.stableCount,
    needsAttentionCount: retentionView.weeklyReview.needsAttentionCount,
  });
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
      <section className="hexis-card p-5 sm:p-6">
        <p className="hexis-eyebrow">Week at a glance</p>
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
        <div className="mt-4 rounded-md border bg-[var(--color-background)] p-3">
          <p className="hexis-eyebrow">Main takeaway</p>
          <p className="mt-1 text-sm">{weeklyTakeaway}</p>
        </div>
      </section>

      <section className="hexis-card mt-6 p-4 sm:p-5">
        <p className="hexis-eyebrow">Next best step</p>
        {primarySuggestedAction ? (
          <div className="mt-3 rounded-md border bg-[var(--color-background)] p-3">
            <p className="text-sm font-medium">{primarySuggestedAction.title}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{primarySuggestedAction.description}</p>
            <form action={runRetentionAction} className="mt-3">
              <input type="hidden" name="kind" value="SUGGESTED_ACTION" />
              <input type="hidden" name="actionKey" value={primarySuggestedAction.key} />
              <input type="hidden" name="path" value={primarySuggestedAction.href} />
              <button className="hexis-button-secondary px-3 py-2 text-sm">
                Open
              </button>
            </form>
          </div>
        ) : primaryRecommendation ? (
          <ul className="mt-3 space-y-3">
            <RecommendationItem
              recommendation={primaryRecommendation}
              allowActions
              actionSource="return_session"
            />
          </ul>
        ) : (
          <div className="mt-3 rounded-md border bg-[var(--color-background)] p-3">
            <p className="text-sm text-[var(--color-muted)]">
              No urgent action this week. Log one focused block to keep momentum visible.
            </p>
          </div>
        )}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="hexis-card p-4 sm:p-5">
          <p className="hexis-eyebrow">What got better</p>
          {retentionView.weeklyReview.improved.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              No clear gain yet. A short reinforcement log can start this trend.
            </p>
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

      <details className="hexis-card mt-6 p-4 sm:p-5">
        <summary className="cursor-pointer text-sm font-medium">Adjust weekly focus</summary>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Keep this narrow: one template + one weekly focus.
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
          </label>
          <div className="lg:col-span-2">
            <button className="hexis-button-secondary px-4 py-2 text-sm">
              Save weekly focus
            </button>
          </div>
        </form>
      </details>
    </AppShell>
  );
}

function buildWeeklyTakeaway(input: {
  improvedCount: number;
  declinedCount: number;
  stableCount: number;
  needsAttentionCount: number;
}): string {
  if (input.declinedCount > input.improvedCount) {
    return `${input.declinedCount} area(s) slipped. This week is about stabilization first.`;
  }
  if (input.improvedCount > 0 && input.declinedCount === 0) {
    return `${input.improvedCount} area(s) improved with limited drift. Reinforce the same cadence.`;
  }
  if (input.stableCount > 0 && input.needsAttentionCount === 0) {
    return "Most attributes stayed stable. Keep one focused maintenance block visible this week.";
  }
  return "Mixed week. Keep one clear focus and log one meaningful block early.";
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
