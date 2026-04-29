import Link from "next/link";
import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { AttributeScale } from "@/modules/shared/presentation/components/attribute-scale";
import { StatusBadge } from "@/modules/shared/presentation/components/status-badge";
import { XpBar } from "@/modules/shared/presentation/components/xp-bar";
import { computeLevel } from "@/modules/shared/application/level";
import { requireOnboardedUser } from "@/shared/auth/route-guards";
import { readDashboard } from "@/modules/attributes/application/read-dashboard.query";
import { syncCultivationStateAction } from "@/modules/decay/presentation/sync.actions";
import { readRetentionView } from "@/modules/retention/application/read-retention.query";
import { runRetentionAction } from "@/modules/retention/presentation/retention.actions";
import { readUserLoopView } from "@/modules/loops/application/read-user-loop.query";
import { RecommendationItem } from "@/modules/recommendations/presentation/components/recommendation-item";
import { readUserOnboardingContext } from "@/modules/onboarding/application/read-onboarding-context.query";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import { PRODUCT_EVENT_NAME } from "@/modules/analytics/domain/product-event-catalog";

async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireOnboardedUser();
  const emptySearchParams: Record<string, string | string[] | undefined> = {};
  const [dashboard, onboardingContext, retentionView, userLoop, resolvedSearchParams] =
    await Promise.all([
      readDashboard(user.id),
      readUserOnboardingContext(user.id),
      readRetentionView(user.id, new Date()),
      readUserLoopView(user.id),
      searchParams ?? Promise.resolve(emptySearchParams),
    ]);

  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.DASHBOARD_VIEWED,
    userId: user.id,
    properties: { source: "app" },
  });
  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.RETURN_SUMMARY_VIEWED,
    userId: user.id,
    properties: {
      isReturningUser: retentionView.sinceLastVisit.isReturningUser,
      improvedCount: retentionView.sinceLastVisit.improvedCount,
      declinedCount: retentionView.sinceLastVisit.declinedCount,
      needsAttentionCount: retentionView.sinceLastVisit.needsAttentionCount,
    },
  });

  const primaryRecommendation = dashboard.recommendations[0];
  const secondaryRecommendations = dashboard.recommendations.slice(1);
  const atRiskOrDecaying = dashboard.attributes
    .filter((a) => a.status === "AT_RISK" || a.status === "DECAYING")
    .slice(0, 4);
  const strongestMomentum = dashboard.attributes
    .filter((a) => a.status === "IMPROVING")
    .slice(0, 4);
  const snapshotAttributes = dashboard.attributes.slice(0, 4);
  const { level, currentXp, maxXp } = computeLevel(dashboard.composite);

  const recommendedLogHref = onboardingContext
    ? `/log?source=dashboard_goal&goal=${onboardingContext.cultivationGoal.value}`
    : "/log";

  if (primaryRecommendation) {
    await trackProductEventSafely({
      eventName: PRODUCT_EVENT_NAME.RECOMMENDATION_RATIONALE_VIEWED,
      userId: user.id,
      properties: { recommendationId: primaryRecommendation.id, surface: "dashboard" },
    });
    if (primaryRecommendation.influencedByTemplateKey === userLoop.template.key) {
      await trackProductEventSafely({
        eventName: PRODUCT_EVENT_NAME.TEMPLATE_INFLUENCED_RECOMMENDATION_SHOWN,
        userId: user.id,
        properties: {
          recommendationId: primaryRecommendation.id,
          templateKey: userLoop.template.key,
        },
      });
    }
  }

  const activationParam = resolvedSearchParams.activation;
  const showActivationPanel = activationParam === "1" && dashboard.eventCount < 2;

  return (
    <AppShell
      title={user.profile?.displayName ?? "Personagem"}
      eyebrow="Painel"
      currentPath="/dashboard"
      displayName={user.profile?.displayName ?? user.email}
      actions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <form action={syncCultivationStateAction} className="hidden sm:block">
            <button className="hexis-button-secondary px-3 py-2 text-sm">
              Sincronizar
            </button>
          </form>
          <Link href="/attributes" className="hexis-button-secondary px-3 py-2 text-sm">
            Habilidades
          </Link>
          <Link
            href={recommendedLogHref}
            className="min-h-11 rounded-md px-4 py-2 text-sm font-semibold"
            style={{ background: "var(--color-gold)", color: "var(--color-gold-foreground)" }}
          >
            Registrar ação
          </Link>
        </div>
      }
    >
      {/* XP Bar */}
      <section className="hexis-card mb-6 p-4 sm:p-5">
        <XpBar level={level} currentXp={currentXp} maxXp={maxXp} />
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Stat label="Em Alta" value={`${dashboard.improvingCount}`} />
          <Stat label="Precisam de atenção" value={`${dashboard.needsCareCount}`} />
          <Stat label="Pontuação" value={`${dashboard.composite.toFixed(1)}`} />
        </div>
      </section>

      {/* Ativação */}
      {showActivationPanel && onboardingContext ? (
        <section className="hexis-card mb-6 p-5 sm:p-6">
          <p className="hexis-eyebrow">Primeiros passos</p>
          <h2 className="mt-2 text-xl font-semibold">
            Comece com {onboardingContext.cultivationGoal.label}
          </h2>
          <p className="mt-2 max-w-3xl text-sm" style={{ color: "var(--color-muted)" }}>
            O Hexis acompanha como seus atributos respondem a ações ao longo do tempo.
            Registre sua primeira ação concreta alinhada com {onboardingContext.cultivationGoal.label.toLowerCase()}.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href={`/log?source=onboarding_activation&goal=${onboardingContext.cultivationGoal.value}`}
              className="min-h-11 rounded-md px-4 py-2 text-sm font-semibold"
              style={{ background: "var(--color-gold)", color: "var(--color-gold-foreground)" }}
            >
              Registrar primeira ação
            </Link>
            <Link href="/attributes" className="hexis-button-secondary px-4 py-2 text-sm">
              Ver habilidades
            </Link>
          </div>
        </section>
      ) : null}

      {/* Missão sugerida */}
      <section className="hexis-card mb-6 p-5 sm:p-6">
        <h2 className="text-base font-semibold">Missão sugerida</h2>
        {primaryRecommendation ? (
          <ul className="mt-3">
            <RecommendationItem recommendation={primaryRecommendation} allowActions />
          </ul>
        ) : (
          <p className="mt-3 text-sm" style={{ color: "var(--color-muted)" }}>
            Nenhuma missão crítica agora. Continue registrando ações para manter o momentum.
          </p>
        )}
      </section>

      {/* Precisa de atenção + Em Alta */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="hexis-card p-4 sm:p-5">
          <p className="hexis-eyebrow">Precisa de atenção</p>
          <ul className="mt-3 space-y-2">
            {atRiskOrDecaying.length === 0 ? (
              <li className="text-sm" style={{ color: "var(--color-muted)" }}>
                Nenhum declínio crítico detectado.
              </li>
            ) : (
              atRiskOrDecaying.map((attribute) => (
                <li
                  key={attribute.userAttributeId}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                  style={{ background: "var(--color-background)" }}
                >
                  <div>
                    <p className="text-sm font-medium">{attribute.name}</p>
                    <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                      Atual {attribute.currentValue.toFixed(1)} · Base {attribute.baseValue.toFixed(1)}
                    </p>
                  </div>
                  <Link
                    href={`/attributes/${attribute.slug}`}
                    className="flex self-stretch items-center pl-4 text-xs"
                    style={{ color: "var(--color-gold)" }}
                  >
                    Ver
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="hexis-card p-4 sm:p-5">
          <p className="hexis-eyebrow">Em Alta</p>
          <ul className="mt-3 space-y-2">
            {strongestMomentum.length === 0 ? (
              <li className="text-sm" style={{ color: "var(--color-muted)" }}>
                Nenhum atributo em alta ainda. Registre uma ação focada para construir tendência.
              </li>
            ) : (
              strongestMomentum.map((attribute) => (
                <li
                  key={attribute.userAttributeId}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                  style={{ background: "var(--color-background)" }}
                >
                  <div>
                    <p className="text-sm font-medium">{attribute.name}</p>
                    <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                      {attribute.currentValue.toFixed(1)} atual · {attribute.potentialValue.toFixed(1)} potencial
                    </p>
                  </div>
                  <StatusBadge status={attribute.status} />
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      {/* Snapshot de habilidades */}
      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="hexis-eyebrow">Snapshot</p>
            <h2 className="text-xl font-semibold">Suas habilidades</h2>
          </div>
          <Link href="/attributes" className="hexis-button-secondary px-3 py-1.5 text-xs">
            Ver todas
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {snapshotAttributes.map((attribute) => (
            <Link
              key={attribute.slug}
              href={`/attributes/${attribute.slug}`}
              className="hexis-card block p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--color-muted)" }}>
                    {attribute.shortCode}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{attribute.name}</h3>
                </div>
                <StatusBadge status={attribute.status} />
              </div>
              <p className="mt-3 text-3xl font-semibold">{attribute.currentValue.toFixed(1)}</p>
              <div className="mt-3">
                <AttributeScale
                  currentValue={attribute.currentValue}
                  baseValue={attribute.baseValue}
                  potentialValue={attribute.potentialValue}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Desde a última visita */}
      <section className="hexis-card mt-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="hexis-eyebrow">Desde a última visita</p>
            <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
              {retentionView.sinceLastVisit.isReturningUser
                ? `Desde ${formatCompactDateTime(retentionView.sinceLastVisit.sinceAt)}`
                : "Primeira visita"}
            </p>
          </div>
          <form action={runRetentionAction}>
            <input type="hidden" name="kind" value="WEEKLY_REVIEW_CTA" />
            <input type="hidden" name="actionKey" value="open_weekly_review" />
            <input type="hidden" name="path" value="/weekly-review" />
            <button className="hexis-button-secondary px-3 py-2 text-xs">
              Revisão semanal
            </button>
          </form>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Stat label="Melhorou" value={`${retentionView.sinceLastVisit.improvedCount}`} />
          <Stat label="Caiu" value={`${retentionView.sinceLastVisit.declinedCount}`} />
          <Stat label="Estável" value={`${retentionView.sinceLastVisit.stableCount}`} />
        </div>
        <div className="mt-3 rounded-md border p-3" style={{ background: "var(--color-background)" }}>
          <p className="hexis-eyebrow">Rotina atual</p>
          <p className="mt-1 text-sm">
            {userLoop.template.label}
            {userLoop.weeklyFocus
              ? ` · Foco semanal: ${userLoop.weeklyFocus.name}`
              : " · Foco semanal não definido"}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
            {userLoop.template.weeklyPrompt}
          </p>
        </div>
        <p className="mt-3 text-sm" style={{ color: "var(--color-muted)" }}>
          {retentionView.sinceLastVisit.evidenceLoggedCount} ação(ões) registrada(s),{" "}
          {retentionView.sinceLastVisit.newRecommendationCount} atualização(ões) de missão.{" "}
          {retentionView.sinceLastVisit.needsAttentionCount > 0
            ? `${retentionView.sinceLastVisit.needsAttentionCount} atributo(s) precisam de atenção.`
            : "Nenhum declínio crítico no momento."}
        </p>
      </section>

      {/* Ações recentes */}
      <aside className="hexis-card mt-6 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <p className="hexis-eyebrow">Ações recentes</p>
          <Link href="/history" className="text-xs" style={{ color: "var(--color-muted)" }}>
            Ver histórico
          </Link>
        </div>
        {dashboard.recentEvents.length === 0 ? (
          <p className="mt-3 text-sm" style={{ color: "var(--color-muted)" }}>
            Nenhuma ação ainda. Registre a primeira para começar a evoluir.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {dashboard.recentEvents.map((event) => (
              <li key={event.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                <p className="text-sm">{event.title}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
                  {event.eventType} · {event.intensity}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                  {event.occurredAt.toLocaleString("pt-BR")} · {event.impacts.length} atributo(s)
                </p>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Outras missões */}
      {secondaryRecommendations.length > 0 && (
        <section className="hexis-card mt-6 p-4 sm:p-5">
          <p className="hexis-eyebrow">Outras missões</p>
          <ul className="mt-3 space-y-3">
            {secondaryRecommendations.map((recommendation) => (
              <RecommendationItem
                key={recommendation.id}
                recommendation={recommendation}
                allowActions
              />
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3" style={{ background: "var(--color-background)" }}>
      <p className="hexis-eyebrow">{label}</p>
      <p className="mt-1.5 text-xl font-semibold">{value}</p>
    </div>
  );
}

export { DashboardPage as default };

function formatCompactDateTime(value: Date): string {
  return `${value.toLocaleDateString("pt-BR")} ${value.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
