import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { readUserAttributes } from "@/modules/attributes/application/read-attributes.query";
import { LogEvidenceForm } from "@/modules/evidence/presentation/components/log-evidence-form";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import { PRODUCT_EVENT_NAME } from "@/modules/analytics/domain/product-event-catalog";
import { requireOnboardedUser } from "@/shared/auth/route-guards";

async function LogPage() {
  const user = await requireOnboardedUser();
  const attributes = await readUserAttributes(user.id);
  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.LOG_PAGE_OPENED,
    userId: user.id,
    properties: {
      source: "app",
    },
  });

  return (
    <AppShell
      title="Log evidence"
      eyebrow="Evidence"
      currentPath="/log"
      displayName={user.profile?.displayName ?? user.email}
    >
      <p className="max-w-3xl text-sm text-[var(--color-muted)]">
        Log concrete evidence of cultivation: what happened, which attributes were affected,
        and why this event matters.
      </p>
      <div className="mt-6">
        <LogEvidenceForm attributes={attributes} />
      </div>
    </AppShell>
  );
}

export { LogPage as default };
