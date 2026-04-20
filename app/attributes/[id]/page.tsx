import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { AttributeScale } from "@/modules/shared/presentation/components/attribute-scale";
import { StatusBadge } from "@/modules/shared/presentation/components/status-badge";
import { readUserAttributeDetail } from "@/modules/attributes/application/read-attributes.query";
import { readAttributeHistory, readEvidenceHistory } from "@/modules/evidence/application/read-history.query";
import { readRecommendationsForAttribute } from "@/modules/recommendations/application/read-recommendations.query";
import { RecommendationItem } from "@/modules/recommendations/presentation/components/recommendation-item";
import { requireOnboardedUser } from "@/shared/auth/route-guards";

async function AttributeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireOnboardedUser();
  const resolvedParams = await params;
  const attribute = await readUserAttributeDetail(user.id, resolvedParams.id);

  if (!attribute) {
    notFound();
  }

  const [history, events, recommendations] = await Promise.all([
    readAttributeHistory(user.id, attribute.userAttributeId),
    readEvidenceHistory(user.id),
    readRecommendationsForAttribute(user.id, attribute.definitionId),
  ]);
  const recentEvents = events
    .filter((event) =>
      event.impacts.some((impact) => impact.userAttributeId === attribute.userAttributeId),
    )
    .slice(0, 6);
  const latestHistory = history[0];
  const currentDelta = latestHistory
    ? latestHistory.nextCurrent - latestHistory.previousCurrent
    : 0;

  return (
    <AppShell
      title={attribute.name}
      eyebrow={attribute.shortCode}
      currentPath="/attributes"
      displayName={user.profile?.displayName ?? user.email}
      actions={
        <Link href="/log" className="rounded-md bg-[var(--color-foreground)] px-3 py-2 text-sm text-[var(--color-background)]">
          Log practice
        </Link>
      }
    >
      <Link href="/attributes" className="text-sm text-[var(--color-muted)]">← All attributes</Link>

      <section className="hexis-card mt-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">{attribute.name}</h2>
            <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">{attribute.description}</p>
          </div>
          <StatusBadge status={attribute.status} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Metric label="Current" value={attribute.currentValue.toFixed(1)} />
          <Metric label="Base" value={attribute.baseValue.toFixed(1)} />
          <Metric label="Potential" value={attribute.potentialValue.toFixed(1)} />
        </div>

        <div className="mt-5">
          <AttributeScale
            currentValue={attribute.currentValue}
            baseValue={attribute.baseValue}
            potentialValue={attribute.potentialValue}
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <InfoPill
            label="Last event"
            value={attribute.lastEventAt ? attribute.lastEventAt.toLocaleString() : "No evidence yet"}
          />
          <InfoPill
            label="Last decay check"
            value={attribute.lastDecayCheckAt ? attribute.lastDecayCheckAt.toLocaleString() : "Not checked yet"}
          />
          <InfoPill
            label="Latest current delta"
            value={`${currentDelta >= 0 ? "+" : ""}${currentDelta.toFixed(2)}`}
          />
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-12">
        <section className="hexis-card p-6 xl:col-span-8">
          <p className="hexis-eyebrow">History log</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">Every change includes a cause and explicit deltas.</p>

          <ul className="mt-4 space-y-3">
            {history.map((entry) => (
              <li key={entry.id} className="rounded-md border bg-[var(--color-background)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">{entry.causeType}</p>
                  <p className="text-xs text-[var(--color-muted)]">{entry.changedAt.toLocaleString()}</p>
                </div>
                <p className="mt-2 text-sm">{entry.explanation}</p>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  Current {entry.previousCurrent.toFixed(2)} → {entry.nextCurrent.toFixed(2)} · Base {entry.previousBase.toFixed(2)} → {entry.nextBase.toFixed(2)} · Potential {entry.previousPotential.toFixed(2)} → {entry.nextPotential.toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-6 xl:col-span-4">
          <div className="hexis-card p-5">
            <p className="hexis-eyebrow">Recommendation state</p>
            <ul className="mt-3 space-y-3">
              {recommendations.length === 0 ? (
                <li className="text-sm text-[var(--color-muted)]">No recommendation history for this attribute.</li>
              ) : (
                recommendations.map((recommendation) => (
                  <RecommendationItem
                    key={recommendation.id}
                    recommendation={recommendation}
                    allowActions={recommendation.status === "ACTIVE"}
                  />
                ))
              )}
            </ul>
          </div>

          <div className="hexis-card p-5">
            <p className="hexis-eyebrow">Recent evidence</p>
            <ul className="mt-3 space-y-2">
              {recentEvents.length === 0 ? (
                <li className="text-sm text-[var(--color-muted)]">No direct evidence linked yet.</li>
              ) : (
                recentEvents.map((event) => (
                  <li key={event.id} className="rounded-md border bg-[var(--color-background)] p-3">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {event.eventType} · {event.intensity} · {event.occurredAt.toLocaleString()}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-[var(--color-background)] p-4">
      <p className="hexis-eyebrow">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-[var(--color-background)] p-3">
      <p className="hexis-eyebrow">{label}</p>
      <p className="mt-1 text-xs text-[var(--color-muted)]">{value}</p>
    </div>
  );
}

export default AttributeDetailPage;
