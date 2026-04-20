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
      title="Log evidence"
      eyebrow="Evidence"
      currentPath="/log"
      displayName={user.profile?.displayName ?? user.email}
    >
      {goalGuidance ? (
        <div className="mb-4 rounded-md border bg-[var(--color-surface)] px-4 py-3">
          <p className="text-sm font-medium">Suggested start: {goalGuidance.label}</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Record one concrete block aligned with this goal so Hexis can calibrate your next recommendation.
          </p>
        </div>
      ) : null}
      <p className="max-w-3xl text-sm text-[var(--color-muted)]">
        Log concrete evidence of cultivation: what happened, which attributes were affected,
        and why this event matters.
      </p>
      <div className="mt-6">
        <LogEvidenceForm attributes={attributes} goalGuidance={goalGuidance} />
      </div>
    </AppShell>
  );
}

export { LogPage as default };
