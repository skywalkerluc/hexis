import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { AttributeScale } from "@/modules/shared/presentation/components/attribute-scale";
import { StatusBadge } from "@/modules/shared/presentation/components/status-badge";
import { readUserAttributeDetail } from "@/modules/attributes/application/read-attributes.query";
import { readAttributeHistory, readEvidenceHistory } from "@/modules/evidence/application/read-history.query";
import { readRecommendationsForAttribute } from "@/modules/recommendations/application/read-recommendations.query";
import { RecommendationItem } from "@/modules/recommendations/presentation/components/recommendation-item";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import { PRODUCT_EVENT_NAME } from "@/modules/analytics/domain/product-event-catalog";
import { requireOnboardedUser } from "@/shared/auth/route-guards";

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const MAINTAINED_DAYS_THRESHOLD = 3;

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
  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.ATTRIBUTE_DETAIL_VIEWED,
    userId: user.id,
    properties: {
      attributeSlug: attribute.slug,
    },
  });

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
  const recentHistory = history.slice(0, 12);
  const influences = summarizeRecentInfluences(attribute.userAttributeId, recentEvents);
  const daysSinceEvidence = attribute.lastEventAt
    ? Math.floor(
        (Date.now() - attribute.lastEventAt.getTime()) /
          (HOURS_PER_DAY *
            MINUTES_PER_HOUR *
            SECONDS_PER_MINUTE *
            MILLISECONDS_PER_SECOND),
      )
    : null;
  const attributeState = inferAttributeState({
    status: attribute.status,
    daysSinceEvidence,
    positiveCount: influences.helping.length,
    negativeCount: influences.hurting.length,
  });
  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.ATTRIBUTE_EXPLANATION_VIEWED,
    userId: user.id,
    properties: {
      attributeSlug: attribute.slug,
      state: attributeState,
    },
  });
  if (recommendations[0]) {
    await trackProductEventSafely({
      eventName: PRODUCT_EVENT_NAME.RECOMMENDATION_RATIONALE_VIEWED,
      userId: user.id,
      properties: {
        recommendationId: recommendations[0].id,
        surface: "attribute_detail",
      },
    });
  }

  return (
    <AppShell
      title={attribute.name}
      eyebrow={attribute.shortCode}
      currentPath="/attributes"
      displayName={user.profile?.displayName ?? user.email}
      actions={
        <Link href="/log" className="min-h-10 rounded-md bg-[var(--color-foreground)] px-3 py-2 text-sm text-[var(--color-background)]">
          Log practice
        </Link>
      }
    >
      <Link href="/attributes" className="inline-flex rounded-md border px-3 py-1.5 text-sm text-[var(--color-muted)]">← All attributes</Link>

      <section className="hexis-card mt-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">{attribute.name}</h2>
            <p className="mt-1 max-w-3xl text-sm text-[var(--color-muted)]">{attribute.description}</p>
          </div>
          <StatusBadge status={attribute.status} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
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

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          {buildInfluenceInterpretation({
            state: attributeState,
            daysSinceEvidence,
          })}
        </p>
      </section>

      <section className="hexis-card mt-6 p-5 sm:p-6">
        <p className="hexis-eyebrow">What to do next</p>
        {recommendations[0] ? (
          <ul className="mt-3 space-y-3">
            <RecommendationItem
              recommendation={recommendations[0]}
              allowActions={recommendations[0].status === "ACTIVE"}
            />
          </ul>
        ) : (
          <div className="mt-3 rounded-md border bg-[var(--color-background)] p-3">
            <p className="text-sm text-[var(--color-muted)]">
              No active recommendation right now. Log one focused block to refresh guidance.
            </p>
            <Link
              href="/log"
              className="mt-3 inline-flex min-h-10 items-center rounded-md border px-3 py-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            >
              Log evidence
            </Link>
          </div>
        )}
      </section>

      <section className="hexis-card mt-6 p-5 sm:p-6">
        <p className="hexis-eyebrow">Recent influence</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-md border bg-[var(--color-background)] p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Helping recently</p>
            {influences.helping.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--color-muted)]">No positive signal yet. A reinforcement log can establish one.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {influences.helping.slice(0, 2).map((item) => (
                  <li key={item.eventId} className="text-sm">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-[var(--color-muted)]"> · +{item.deltaCurrent.toFixed(2)} current</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-md border bg-[var(--color-background)] p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Hurting recently</p>
            {influences.hurting.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--color-muted)]">No strong negative signal in recent evidence.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {influences.hurting.slice(0, 2).map((item) => (
                  <li key={item.eventId} className="text-sm">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-[var(--color-muted)]"> · {item.deltaCurrent.toFixed(2)} current</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/history"
            className="inline-flex min-h-10 items-center rounded-md border px-3 py-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            Open full history
          </Link>
          <Link
            href="/log"
            className="inline-flex min-h-10 items-center rounded-md border px-3 py-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            Log evidence
          </Link>
        </div>
      </section>

      <details className="hexis-card mt-6 p-5 sm:p-6">
        <summary className="cursor-pointer text-sm font-medium">Deep dive</summary>
        <div className="mt-4 space-y-5">
          <div>
            <p className="hexis-eyebrow">How to read this attribute</p>
            <div className="mt-3 grid gap-3">
              <ExplainRow
                label="Current"
                description="Responds fastest to your recent behavior."
              />
              <ExplainRow
                label="Base"
                description="Moves slower and reflects durable conditioning."
              />
              <ExplainRow
                label="Potential"
                description="Hardest to change and defines your sustainable ceiling."
              />
              <ExplainRow
                label="Maintenance vs decay"
                description="Regular evidence keeps current near base; long neglect lowers current first, then can erode base."
              />
            </div>
          </div>

          <div>
            <p className="hexis-eyebrow">Recent evidence</p>
            <ul className="mt-3 space-y-2">
              {recentEvents.length === 0 ? (
                <li className="rounded-md border bg-[var(--color-background)] p-3 text-sm text-[var(--color-muted)]">
                  No direct evidence yet. <Link href="/log" className="underline">Log one block</Link> to establish a reliable signal.
                </li>
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

          <div>
            <p className="hexis-eyebrow">History log</p>
            <ul className="mt-3 space-y-3">
              {recentHistory.length === 0 ? (
                <li className="rounded-md border bg-[var(--color-background)] p-3 text-sm text-[var(--color-muted)]">
                  No history yet for this attribute.
                </li>
              ) : (
                recentHistory.map((entry) => (
                  <li key={entry.id} className="rounded-md border bg-[var(--color-background)] p-3 sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">{entry.causeType}</p>
                      <p className="text-xs text-[var(--color-muted)]">{entry.changedAt.toLocaleString()}</p>
                    </div>
                    <p className="mt-2 text-sm">{entry.explanation}</p>
                    <p className="mt-2 text-xs text-[var(--color-muted)]">
                      Cur {entry.previousCurrent.toFixed(2)} → {entry.nextCurrent.toFixed(2)} · Base {entry.previousBase.toFixed(2)} → {entry.nextBase.toFixed(2)} · Pot {entry.previousPotential.toFixed(2)} → {entry.nextPotential.toFixed(2)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <p className="hexis-eyebrow">Recommendation history</p>
            <ul className="mt-3 space-y-3">
              {recommendations.length === 0 ? (
                <li className="rounded-md border bg-[var(--color-background)] p-3 text-sm text-[var(--color-muted)]">
                  No recommendation history for this attribute yet.
                </li>
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
        </div>
      </details>
    </AppShell>
  );
}

type InfluenceItem = {
  eventId: string;
  title: string;
  deltaCurrent: number;
};

function summarizeRecentInfluences(
  userAttributeId: string,
  recentEvents: {
    id: string;
    title: string;
    impacts: { userAttributeId: string; deltaCurrent: number }[];
  }[],
): {
  helping: InfluenceItem[];
  hurting: InfluenceItem[];
} {
  const helping: InfluenceItem[] = [];
  const hurting: InfluenceItem[] = [];

  for (const event of recentEvents) {
    const impact = event.impacts.find((item) => item.userAttributeId === userAttributeId);
    if (!impact) {
      continue;
    }
    const item: InfluenceItem = {
      eventId: event.id,
      title: event.title,
      deltaCurrent: impact.deltaCurrent,
    };
    if (impact.deltaCurrent >= 0) {
      helping.push(item);
      continue;
    }
    hurting.push(item);
  }

  return {
    helping: helping.sort((left, right) => right.deltaCurrent - left.deltaCurrent).slice(0, 3),
    hurting: hurting.sort((left, right) => left.deltaCurrent - right.deltaCurrent).slice(0, 3),
  };
}

function inferAttributeState(input: {
  status: string;
  daysSinceEvidence: number | null;
  positiveCount: number;
  negativeCount: number;
}): "MAINTAINED" | "NEGLECTED" | "RECOVERING" | "MIXED" {
  if (
    input.status === "IMPROVING" &&
    input.positiveCount > 0 &&
    (input.daysSinceEvidence === null || input.daysSinceEvidence <= MAINTAINED_DAYS_THRESHOLD)
  ) {
    return "RECOVERING";
  }
  if (
    (input.status === "DECAYING" || input.status === "AT_RISK") &&
    (input.daysSinceEvidence === null || input.daysSinceEvidence > MAINTAINED_DAYS_THRESHOLD)
  ) {
    return "NEGLECTED";
  }
  if (input.positiveCount > 0 && input.negativeCount > 0) {
    return "MIXED";
  }
  return "MAINTAINED";
}

function buildInfluenceInterpretation(input: {
  state: "MAINTAINED" | "NEGLECTED" | "RECOVERING" | "MIXED";
  daysSinceEvidence: number | null;
}): string {
  if (input.state === "RECOVERING") {
    return "Recent reinforcement is helping this attribute recover after prior drift.";
  }
  if (input.state === "NEGLECTED") {
    return "This attribute is slipping through lack of reinforcement. A short maintenance block is the fastest stabilizer.";
  }
  if (input.state === "MIXED") {
    return "Signals are mixed: some recent actions helped, while others pulled this attribute down.";
  }
  if (input.daysSinceEvidence === null) {
    return "No direct evidence yet. Logging one concrete block will establish the first reliable signal.";
  }
  return "This attribute appears stable because recent reinforcement is still present.";
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

function ExplainRow({ label, description }: { label: string; description: string }) {
  return (
    <div className="rounded-md border bg-[var(--color-background)] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-sm">{description}</p>
    </div>
  );
}

export default AttributeDetailPage;
