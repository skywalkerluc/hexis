import Link from "next/link";
import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { AttributeScale } from "@/modules/shared/presentation/components/attribute-scale";
import { StatusBadge } from "@/modules/shared/presentation/components/status-badge";
import { requireOnboardedUser } from "@/shared/auth/route-guards";
import { readDashboard } from "@/modules/attributes/application/read-dashboard.query";
import { syncCultivationStateAction } from "@/modules/decay/presentation/sync.actions";
import { RecommendationItem } from "@/modules/recommendations/presentation/components/recommendation-item";

async function DashboardPage() {
  const user = await requireOnboardedUser();
  const dashboard = await readDashboard(user.id);
  const atRiskOrDecaying = dashboard.attributes
    .filter((attribute) => attribute.status === "AT_RISK" || attribute.status === "DECAYING")
    .slice(0, 4);
  const strongestMomentum = dashboard.attributes
    .filter((attribute) => attribute.status === "IMPROVING")
    .slice(0, 4);

  return (
    <AppShell
      title={`Good practice, ${user.profile?.displayName ?? "User"}`}
      eyebrow="Today · control room"
      currentPath="/dashboard"
      displayName={user.profile?.displayName ?? user.email}
      actions={
        <div className="flex items-center gap-2">
          <form action={syncCultivationStateAction}>
            <button className="rounded-md border px-3 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
              Sync state
            </button>
          </form>
          <Link href="/log" className="rounded-md bg-[var(--color-foreground)] px-3 py-2 text-sm text-[var(--color-background)]">
            Log evidence
          </Link>
        </div>
      }
    >
      <section className="hexis-card p-6">
        <p className="hexis-eyebrow">Character overview</p>
        <div className="mt-3 grid gap-5 md:grid-cols-3">
          <Stat label="Composite" value={`${dashboard.composite.toFixed(1)} / 20`} />
          <Stat label="Improving" value={`${dashboard.improvingCount} attributes`} />
          <Stat label="Needs care" value={`${dashboard.needsCareCount} attributes`} />
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="hexis-card p-5">
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
        <div className="hexis-card p-5">
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
              <p className="hexis-eyebrow">Core attributes</p>
              <h2 className="text-xl font-semibold">Current state</h2>
            </div>
            <Link href="/attributes" className="text-sm text-[var(--color-muted)]">View all</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {dashboard.attributes.slice(0, 6).map((attribute) => (
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
          <div className="hexis-card p-5">
            <p className="hexis-eyebrow">Recommendations</p>
            <ul className="mt-3 space-y-3">
              {dashboard.recommendations.length === 0 ? (
                <li className="text-sm text-[var(--color-muted)]">No active recommendations.</li>
              ) : (
                dashboard.recommendations.map((recommendation) => (
                  <RecommendationItem
                    key={recommendation.id}
                    recommendation={recommendation}
                    allowActions
                  />
                ))
              )}
            </ul>
          </div>

          <div className="hexis-card p-5">
            <p className="hexis-eyebrow">Recent evidence</p>
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
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="hexis-eyebrow">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export { DashboardPage as default };
