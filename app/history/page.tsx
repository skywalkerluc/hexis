import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { readEvidenceHistory } from "@/modules/evidence/application/read-history.query";
import { requireOnboardedUser } from "@/shared/auth/route-guards";

async function HistoryPage() {
  const user = await requireOnboardedUser();
  const events = await readEvidenceHistory(user.id);

  return (
    <AppShell
      title="History"
      eyebrow="Evidence"
      currentPath="/history"
      displayName={user.profile?.displayName ?? user.email}
    >
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
    </AppShell>
  );
}

export { HistoryPage as default };
