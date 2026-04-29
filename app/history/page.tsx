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
  const showLoggedFeedback = resolvedSearchParams.logged === "1";

  return (
    <AppShell
      title="Histórico"
      eyebrow="Ações"
      currentPath="/history"
      displayName={user.profile?.displayName ?? user.email}
    >
      {showLoggedFeedback ? (
        <div
          className="rounded-md border px-4 py-3 text-sm"
          style={{ borderColor: "var(--color-teal)", background: "var(--color-surface-raised)" }}
        >
          Ação registrada e aplicada aos seus atributos.
        </div>
      ) : null}
      <p className="text-sm" style={{ color: "var(--color-muted)" }}>
        Ações em ordem cronológica com explicações por atributo.
      </p>
      <div className="mt-6 space-y-4">
        {events.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Nenhuma ação registrada ainda.
          </p>
        ) : (
          events.map((event) => (
            <article key={event.id} className="hexis-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                    {event.eventType} · {event.intensity} · {event.occurredAt.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
              {event.notes ? (
                <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                  {event.notes}
                </p>
              ) : null}
              <ul className="mt-4 space-y-2">
                {event.impacts.map((impact) => (
                  <li
                    key={impact.userAttributeId}
                    className="rounded-md border p-3 text-sm"
                    style={{ background: "var(--color-background)" }}
                  >
                    <p>
                      <span className="font-medium">{impact.attributeName}</span> ·{" "}
                      {impact.deltaCurrent >= 0 ? "+" : ""}
                      {impact.deltaCurrent.toFixed(2)} atual
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                      {impact.explanation}
                    </p>
                  </li>
                ))}
              </ul>
            </article>
          ))
        )}
      </div>

      <section className="hexis-card mt-8 p-5">
        <p className="hexis-eyebrow">Histórico de missões</p>
        <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
          Missões passadas e atuais com status e próximo passo.
        </p>
        <ul className="mt-4 space-y-3">
          {recommendationTimeline.length === 0 ? (
            <li className="text-sm" style={{ color: "var(--color-muted)" }}>
              Nenhuma missão ainda.
            </li>
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
