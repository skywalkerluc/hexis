import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { readEvidenceHistory } from "@/modules/evidence/application/read-history.query";
import { readRecommendationTimeline } from "@/modules/recommendations/application/read-recommendations.query";
import { RecommendationItem } from "@/modules/recommendations/presentation/components/recommendation-item";
import { requireOnboardedUser } from "@/shared/auth/route-guards";

async function HistoryPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireOnboardedUser();
  const emptySearchParams: Record<string, string | string[] | undefined> = {};
  const [events, recommendationTimeline, resolvedSearchParams] = await Promise.all([
    readEvidenceHistory(user.id),
    readRecommendationTimeline(user.id),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const loggedParam = resolvedSearchParams.logged;
  const showLoggedFeedback = loggedParam === "1";

  return (
    <AppShell
      title="History"
      eyebrow="Evidence"
      currentPath="/history"
      displayName={user.profile?.displayName ?? user.email}
    >
      {showLoggedFeedback ? (
        <div className="rounded-md border border-[var(--color-teal)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-[var(--color-foreground)]">
          Evidence logged and applied to your attribute state.
        </div>
      ) : null}
      <p className="text-sm text-[var(--color-muted)]">Chronological evidence with per-attribute explanations.</p>
      <div className="mt-6 space-y-4">
        {events.map((event) => (
          <article key={event.id} className="hexis-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{event.title}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {event.eventType} · {event.intensity} · {event.occurredAt.toLocaleString()}
                </p>
              </div>
            </div>
            {event.notes ? <p className="mt-2 text-sm text-[var(--color-muted)]">{event.notes}</p> : null}
            <ul className="mt-4 space-y-2">
              {event.impacts.map((impact) => (
                <li key={impact.userAttributeId} className="rounded-md border bg-[var(--color-background)] p-3 text-sm">
                  <p>
                    <span className="font-medium">{impact.attributeName}</span> · {impact.deltaCurrent >= 0 ? "+" : ""}
                    {impact.deltaCurrent.toFixed(2)} current
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{impact.explanation}</p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <section className="hexis-card mt-8 p-5">
        <p className="hexis-eyebrow">Recommendation history</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Past and current guidance, with status and next best step.
        </p>
        <ul className="mt-4 space-y-3">
          {recommendationTimeline.length === 0 ? (
            <li className="text-sm text-[var(--color-muted)]">No recommendations yet.</li>
          ) : (
            recommendationTimeline.map((recommendation) => (
              <RecommendationItem
                key={recommendation.id}
                recommendation={recommendation}
                allowActions={recommendation.status === "ACTIVE"}
              />
            ))
          )}
        </ul>
      </section>
    </AppShell>
  );
}

export { HistoryPage as default };
