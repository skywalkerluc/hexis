import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { readUserAttributes } from "@/modules/attributes/application/read-attributes.query";
import { LogEvidenceForm } from "@/modules/evidence/presentation/components/log-evidence-form";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import { PRODUCT_EVENT_NAME } from "@/modules/analytics/domain/product-event-catalog";
import { readUserOnboardingContext } from "@/modules/onboarding/application/read-onboarding-context.query";
import { readUserLoopView } from "@/modules/loops/application/read-user-loop.query";
import { prismaClient } from "@/shared/db/prisma-client";
import { requireOnboardedUser } from "@/shared/auth/route-guards";

async function LogPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireOnboardedUser();
  const emptySearchParams: Record<string, string | string[] | undefined> = {};
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(emptySearchParams));
  const sourceParam = resolvedSearchParams.source;
  const source =
    sourceParam === "onboarding_activation" || sourceParam === "dashboard_goal"
      ? sourceParam
      : "app";
  const [attributes, onboardingContext, userLoop, evidenceCount] = await Promise.all([
    readUserAttributes(user.id),
    readUserOnboardingContext(user.id),
    readUserLoopView(user.id),
    prismaClient.evidenceEvent.count({ where: { userId: user.id } }),
  ]);
  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.LOG_PAGE_OPENED,
    userId: user.id,
    properties: {
      source,
    },
  });
  if (
    evidenceCount === 0 &&
    onboardingContext &&
    (source === "onboarding_activation" || source === "dashboard_goal")
  ) {
    await trackProductEventSafely({
      eventName: PRODUCT_EVENT_NAME.LOG_STARTED_FROM_GUIDED_CTA,
      userId: user.id,
      properties: {
        source,
        cultivationGoal: onboardingContext.cultivationGoal.value,
      },
    });
  }
  const goalGuidance = onboardingContext
    ? {
        label: userLoop.weeklyFocus
          ? `${onboardingContext.cultivationGoal.label} · ${userLoop.weeklyFocus.name}`
          : userLoop.template.label,
        focusAttributeSlugs: userLoop.weeklyFocus
          ? [userLoop.weeklyFocus.slug]
          : userLoop.template.focusAttributeSlugs,
        suggestedEventType: onboardingContext.cultivationGoal.suggestedEventType,
      }
    : null;

  return (
    <AppShell
      title="Registrar ação"
      eyebrow="Ação"
      currentPath="/log"
      displayName={user.profile?.displayName ?? user.email}
    >
      {goalGuidance ? (
        <div className="mb-4 rounded-md border px-4 py-3" style={{ background: "var(--color-surface)" }}>
          <p className="text-sm font-medium">Foco sugerido: {goalGuidance.label}</p>
          <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
            Registre uma ação alinhada a esse objetivo para o Hexis calibrar sua próxima missão.
          </p>
        </div>
      ) : null}
      <p className="max-w-3xl text-sm" style={{ color: "var(--color-muted)" }}>
        Registre o que você fez — treino, leitura, trabalho focado, qualquer coisa que moveu um atributo.
      </p>
      <div className="mt-6">
        <LogEvidenceForm attributes={attributes} goalGuidance={goalGuidance} />
      </div>
    </AppShell>
  );
}

export { LogPage as default };
