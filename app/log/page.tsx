import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { readUserAttributes } from "@/modules/attributes/application/read-attributes.query";
import { LogEvidenceForm } from "@/modules/evidence/presentation/components/log-evidence-form";
import { requireOnboardedUser } from "@/shared/auth/route-guards";

async function LogPage() {
  const user = await requireOnboardedUser();
  const attributes = await readUserAttributes(user.id);

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
