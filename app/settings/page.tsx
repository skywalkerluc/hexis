import Link from "next/link";
import { cookies } from "next/headers";
import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { logoutAction } from "@/modules/auth/presentation/auth.actions";
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
          <h2 className="text-lg font-semibold">Account shortcuts</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/profile" className="hexis-button-secondary px-3 py-2 text-sm">
              Edit profile
            </Link>
            <Link href="/history" className="hexis-button-secondary px-3 py-2 text-sm">
              View history
            </Link>
            <form action={logoutAction}>
              <button className="hexis-button-secondary px-3 py-2 text-sm">
                Sign out
              </button>
            </form>
          </div>
        </section>

        <section className="hexis-card p-6">
          <h2 className="text-lg font-semibold">Account status</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Current session: {hasSessionCookie ? "active on this device" : "not active"}.
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Need account help? Use feedback to request password reset or session support.
          </p>
          <Link
            href="/feedback?from=/settings"
            className="hexis-button-secondary mt-3 px-3 py-2 text-sm"
          >
            Request account help
          </Link>
        </section>

        <section className="hexis-card p-6">
          <h2 className="text-lg font-semibold">Product feedback</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Share friction, ambiguity, or improvement ideas linked to this screen.
          </p>
          <Link
            href="/feedback?from=/settings"
            className="hexis-button-secondary mt-3 px-3 py-2 text-sm"
          >
            Open feedback form
          </Link>
        </section>

        <details className="hexis-card p-6">
          <summary className="cursor-pointer text-sm font-medium">Release readiness notes</summary>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            Operational checklist and background readiness notes are kept in <code>docs/v1-readiness-checklist.md</code>.
          </p>
        </details>
      </div>
    </AppShell>
  );
}

export { SettingsPage as default };
