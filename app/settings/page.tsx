import { cookies } from "next/headers";
import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { sessionCookieName } from "@/modules/auth/application/session.service";
import { requireOnboardedUser } from "@/shared/auth/route-guards";

async function SettingsPage() {
  const user = await requireOnboardedUser();
  const cookieStore = await cookies();
  const hasSessionCookie = Boolean(cookieStore.get(sessionCookieName())?.value);

  return (
    <AppShell
      title="Settings"
      eyebrow="Account"
      currentPath="/settings"
      displayName={user.profile?.displayName ?? user.email}
    >
      <div className="space-y-5">
        <section className="hexis-card p-6">
          <h2 className="text-lg font-semibold">Security</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Session cookie status: {hasSessionCookie ? "active" : "not active"}.
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Password changes should be implemented with email verification and revoke-all-session support in the next increment.
          </p>
        </section>

        <section className="hexis-card p-6">
          <h2 className="text-lg font-semibold">Decay recalculation foundation</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Daily decay processing endpoint is available at <code>/api/jobs/daily-decay</code> and protected by job secret header.
          </p>
        </section>
      </div>
    </AppShell>
  );
}

export { SettingsPage as default };
