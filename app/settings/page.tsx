import Link from "next/link";
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
          <h2 className="text-lg font-semibold">Account status</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Current session: {hasSessionCookie ? "active on this device" : "not active"}.
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Need account help? Use feedback to request password reset or session support.
          </p>
          <Link
            href="/feedback?from=/settings"
            className="mt-3 inline-flex min-h-10 items-center rounded-md border px-3 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
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
            className="mt-3 inline-flex min-h-10 items-center rounded-md border px-3 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
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
