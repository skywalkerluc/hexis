import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { FeedbackForm } from "@/modules/feedback/presentation/components/feedback-form";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import { PRODUCT_EVENT_NAME } from "@/modules/analytics/domain/product-event-catalog";
import { requireAppUser } from "@/shared/auth/route-guards";

async function FeedbackPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAppUser();
  const emptySearchParams: Record<string, string | string[] | undefined> = {};
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(emptySearchParams));
  const fromValue = resolvedSearchParams.from;
  const routePath = typeof fromValue === "string" && fromValue.startsWith("/")
    ? fromValue
    : "/dashboard";

  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.FEEDBACK_OPENED,
    userId: user.id,
    properties: {
      routePath,
    },
  });

  return (
    <AppShell
      title="Product feedback"
      eyebrow="v1 readiness"
      currentPath="/feedback"
      displayName={user.profile?.displayName ?? user.email}
    >
      <section className="hexis-card max-w-3xl p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Tell us what felt unclear or useful</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Keep it short and concrete. Feedback is attached to <code>{routePath}</code> so we can
          reproduce context quickly.
        </p>
        <div className="mt-5">
          <FeedbackForm routePath={routePath} />
        </div>
      </section>
    </AppShell>
  );
}

export { FeedbackPage as default };
