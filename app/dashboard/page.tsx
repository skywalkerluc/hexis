import Link from "next/link";
import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { AttributeScale } from "@/modules/shared/presentation/components/attribute-scale";
import { StatusBadge } from "@/modules/shared/presentation/components/status-badge";
import { requireOnboardedUser } from "@/shared/auth/route-guards";
import { readDashboard } from "@/modules/attributes/application/read-dashboard.query";
import { syncCultivationStateAction } from "@/modules/decay/presentation/sync.actions";
import { RecommendationItem } from "@/modules/recommendations/presentation/components/recommendation-item";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import { PRODUCT_EVENT_NAME } from "@/modules/analytics/domain/product-event-catalog";

async function DashboardPage() {
  const user = await requireOnboardedUser();
  const dashboard = await readDashboard(user.id);
  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.DASHBOARD_VIEWED,
    userId: user.id,
    properties: {
      source: "app",
    },
  });
  const atRiskOrDecaying = dashboard.attributes
    .filter((attribute) => attribute.status === "AT_RISK" || attribute.status === "DECAYING")
    .slice(0, 4);
  const strongestMomentum = dashboard.attributes
    .filter((attribute) => attribute.status === "IMPROVING")
    .slice(0, 4);
  const primaryRecommendation = dashboard.recommendations[0];
  const secondaryRecommendations = dashboard.recommendations.slice(1);
  const primaryAttentionAttribute = atRiskOrDecaying[0];
  const snapshotAttributes = dashboard.attributes.slice(0, 4);

  return (
    <AppShell
      title={`Good practice, ${user.profile?.displayName ?? "User"}`}
      eyebrow="Today · control room"
      currentPath="/dashboard"
      displayName={user.profile?.displayName ?? user.email}
      actions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <form action={syncCultivationStateAction}>
            <button className="min-h-11 rounded-md border px-3 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
              Sync state
            </button>
          </form>
          <Link href="/log" className="min-h-11 rounded-md bg-[var(--color-foreground)] px-3 py-2 text-sm text-[var(--color-background)]">
            Log evidence
          </Link>
        </div>
      }
    >
      <section className="hexis-card p-5 sm:p-6">
        <p className="hexis-eyebrow">What to do next</p>
        {primaryRecommendation ? (
          <ul className="mt-3">
            <RecommendationItem recommendation={primaryRecommendation} allowActions />
          </ul>
        ) : primaryAttentionAttribute ? (
          <div className="mt-3 rounded-md border bg-[var(--color-background)] p-4">
            <p className="text-sm font-medium">{primaryAttentionAttribute.name} needs attention.</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Current {primaryAttentionAttribute.currentValue.toFixed(1)} is below stable base {primaryAttentionAttribute.baseValue.toFixed(1)}.
            </p>
            <Link
              href={`/attributes/${primaryAttentionAttribute.slug}`}
              className="mt-3 inline-flex rounded-md border px-3 py-1.5 text-xs text-[var(--color-gold)]"
            >
              Open attribute detail
            </Link>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            No urgent drift right now. Keep momentum by logging your next meaningful block.
          </p>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Stat label="Composite" value={`${dashboard.composite.toFixed(1)} / 20`} />
          <Stat label="Improving" value={`${dashboard.improvingCount} attributes`} />
          <Stat label="Needs care" value={`${dashboard.needsCareCount} attributes`} />
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="hexis-card p-4 sm:p-5">
          <p className="hexis-eyebrow">Needs attention</p>
          <ul className="mt-3 space-y-2">
            {atRiskOrDecaying.length === 0 ? (
              <li className="text-sm text-[var(--color-muted)]">No critical drift detected right now.</li>
            ) : (
              atRiskOrDecaying.map((attribute) => (
                <li key={attribute.userAttributeId} className="flex items-center justify-between gap-3 rounded-md border bg-[var(--color-background)] px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{attribute.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      Current {attribute.currentValue.toFixed(1)} · Base {attribute.baseValue.toFixed(1)}
                    </p>
                  </div>
                  <Link href={`/attributes/${attribute.slug}`} className="text-xs text-[var(--color-gold)]">
                    Review
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="hexis-card p-4 sm:p-5">
          <p className="hexis-eyebrow">Momentum</p>
          <ul className="mt-3 space-y-2">
            {strongestMomentum.length === 0 ? (
              <li className="text-sm text-[var(--color-muted)]">No improving attributes yet. Log a focused session to build trend.</li>
            ) : (
              strongestMomentum.map((attribute) => (
                <li key={attribute.userAttributeId} className="flex items-center justify-between gap-3 rounded-md border bg-[var(--color-background)] px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{attribute.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {attribute.currentValue.toFixed(1)} current · {attribute.potentialValue.toFixed(1)} potential
                    </p>
                  </div>
                  <StatusBadge status={attribute.status} />
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-12">
        <section className="xl:col-span-8">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="hexis-eyebrow">Snapshot</p>
              <h2 className="text-xl font-semibold">Current state</h2>
            </div>
            <Link href="/attributes" className="text-sm text-[var(--color-muted)]">View all</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {snapshotAttributes.map((attribute) => (
              <Link key={attribute.slug} href={`/attributes/${attribute.slug}`} className="hexis-card block p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">{attribute.shortCode}</p>
                    <h3 className="mt-1 text-lg font-semibold">{attribute.name}</h3>
                  </div>
                  <StatusBadge status={attribute.status} />
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-3xl font-semibold">{attribute.currentValue.toFixed(1)}</p>
                  <p className="text-xs text-[var(--color-muted)]">/ 20</p>
                </div>
                <div className="mt-3">
                  <AttributeScale
                    currentValue={attribute.currentValue}
                    baseValue={attribute.baseValue}
                    potentialValue={attribute.potentialValue}
                  />
                </div>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  Gap to base: {(attribute.currentValue - attribute.baseValue).toFixed(2)}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <aside className="space-y-6 xl:col-span-4">
          <div className="hexis-card p-4 sm:p-5">
            <p className="hexis-eyebrow">Recent evidence</p>
            {dashboard.recentEvents.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                No recent evidence yet. Log one meaningful session to anchor your trend.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {dashboard.recentEvents.map((event) => (
                  <li key={event.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                    <p className="text-sm">{event.title}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-[var(--color-muted)]">
                      {event.eventType} · {event.intensity}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {event.occurredAt.toLocaleString()} · {event.impacts.length} attribute impact(s)
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <section className="hexis-card mt-6 p-4 sm:p-5">
        <p className="hexis-eyebrow">Additional recommendations</p>
        <ul className="mt-3 space-y-3">
          {secondaryRecommendations.length === 0 ? (
            <li className="text-sm text-[var(--color-muted)]">No additional active recommendations.</li>
          ) : (
            secondaryRecommendations.map((recommendation) => (
              <RecommendationItem
                key={recommendation.id}
                recommendation={recommendation}
                allowActions
              />
            ))
          )}
        </ul>
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-[var(--color-background)] p-3">
      <p className="hexis-eyebrow">{label}</p>
      <p className="mt-1.5 text-xl font-semibold">{value}</p>
    </div>
  );
}

export { DashboardPage as default };
