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
    properties: { source: "weekly_review" },
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
      properties: { recommendationId: primaryRecommendation.id, surface: "weekly_review" },
    });
  }

  return (
    <AppShell
      title="Revisão semanal"
      eyebrow="Retenção"
      currentPath="/weekly-review"
      displayName={user.profile?.displayName ?? user.email}
    >
      <section className="hexis-card p-5 sm:p-6">
        <p className="hexis-eyebrow">A semana em resumo</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Metric label="Melhorou" value={`${retentionView.weeklyReview.improvedCount}`} />
          <Metric label="Caiu" value={`${retentionView.weeklyReview.declinedCount}`} />
          <Metric label="Estável" value={`${retentionView.weeklyReview.stableCount}`} />
        </div>
        <p className="mt-3 text-sm" style={{ color: "var(--color-muted)" }}>
          {retentionView.weeklyReview.evidenceLoggedCount} ação(ões) registrada(s),{" "}
          {retentionView.weeklyReview.recommendationUpdates} atualização(ões) de missão,{" "}
          {retentionView.weeklyReview.needsAttentionCount} atributo(s) precisam de atenção.
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
          {retentionView.weeklyReview.interpretation}
        </p>
        <div className="mt-4 rounded-md border p-3" style={{ background: "var(--color-background)" }}>
          <p className="hexis-eyebrow">Conclusão principal</p>
          <p className="mt-1 text-sm">{weeklyTakeaway}</p>
        </div>
      </section>

      <section className="hexis-card mt-6 p-4 sm:p-5">
        <p className="hexis-eyebrow">Próximo melhor passo</p>
        {primarySuggestedAction ? (
          <div className="mt-3 rounded-md border p-3" style={{ background: "var(--color-background)" }}>
            <p className="text-sm font-medium">{primarySuggestedAction.title}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
              {primarySuggestedAction.description}
            </p>
            <form action={runRetentionAction} className="mt-3">
              <input type="hidden" name="kind" value="SUGGESTED_ACTION" />
              <input type="hidden" name="actionKey" value={primarySuggestedAction.key} />
              <input type="hidden" name="path" value={primarySuggestedAction.href} />
              <button className="hexis-button-secondary px-3 py-2 text-sm">Abrir</button>
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
          <div className="mt-3 rounded-md border p-3" style={{ background: "var(--color-background)" }}>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              Nenhuma ação urgente esta semana. Registre um bloco focado para manter o momentum visível.
            </p>
          </div>
        )}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="hexis-card p-4 sm:p-5">
          <p className="hexis-eyebrow">O que melhorou</p>
          {retentionView.weeklyReview.improved.length === 0 ? (
            <p className="mt-3 text-sm" style={{ color: "var(--color-muted)" }}>
              Nenhum ganho claro ainda. Um registro de reforço curto pode iniciar essa tendência.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {retentionView.weeklyReview.improved.map((attribute) => (
                <li
                  key={attribute.userAttributeId}
                  className="rounded-md border px-3 py-2"
                  style={{ background: "var(--color-background)" }}
                >
                  <p className="text-sm font-medium">{attribute.name}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                    +{attribute.deltaCurrent.toFixed(2)} atual · agora {attribute.currentValue.toFixed(1)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="hexis-card p-4 sm:p-5">
          <p className="hexis-eyebrow">O que caiu</p>
          {retentionView.weeklyReview.declined.length === 0 ? (
            <p className="mt-3 text-sm" style={{ color: "var(--color-muted)" }}>
              Nenhum declínio significativo detectado esta semana.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {retentionView.weeklyReview.declined.map((attribute) => (
                <li
                  key={attribute.userAttributeId}
                  className="rounded-md border px-3 py-2"
                  style={{ background: "var(--color-background)" }}
                >
                  <p className="text-sm font-medium">{attribute.name}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                    {attribute.deltaCurrent.toFixed(2)} atual · agora {attribute.currentValue.toFixed(1)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <details className="hexis-card mt-6 p-4 sm:p-5">
        <summary className="cursor-pointer text-sm font-medium">Ajustar foco semanal</summary>
        <p className="mt-2 text-xs" style={{ color: "var(--color-muted)" }}>
          Mantenha simples: uma rotina + um foco semanal.
        </p>
        <form action={updateLoopSettingsAction} className="mt-4 grid gap-4 lg:grid-cols-2">
          <label>
            <span className="text-xs uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
              Rotina
            </span>
            <select
              name="templateKey"
              defaultValue={userLoop.template.key}
              className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
              style={{ background: "var(--color-background)" }}
            >
              {userLoop.templateOptions.map((template) => (
                <option key={template.key} value={template.key}>
                  {template.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
              Foco semanal
            </span>
            <select
              name="weeklyFocusAttributeDefinitionId"
              defaultValue={
                userLoop.weeklyFocus?.attributeDefinitionId ??
                userLoop.weeklyFocusOptions[0]?.attributeDefinitionId
              }
              className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm"
              style={{ background: "var(--color-background)" }}
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
              Salvar foco
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
    return `${input.declinedCount} área(s) caíram. Esta semana é sobre estabilização primeiro.`;
  }
  if (input.improvedCount > 0 && input.declinedCount === 0) {
    return `${input.improvedCount} área(s) melhoraram sem declínio. Reforce o mesmo ritmo.`;
  }
  if (input.stableCount > 0 && input.needsAttentionCount === 0) {
    return "A maioria dos atributos ficou estável. Mantenha um bloco de manutenção focado visível esta semana.";
  }
  return "Semana mista. Mantenha um foco claro e registre um bloco significativo logo cedo.";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3" style={{ background: "var(--color-background)" }}>
      <p className="hexis-eyebrow">{label}</p>
      <p className="mt-1.5 text-xl font-semibold">{value}</p>
    </div>
  );
}

export default WeeklyReviewPage;
