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
          <h2 className="text-lg font-semibold">Security</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Session cookie status: {hasSessionCookie ? "active" : "not active"}.
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Password reset and session revocation are tracked in the v1 readiness checklist.
          </p>
        </section>

        <section className="hexis-card p-6">
          <h2 className="text-lg font-semibold">Readiness</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Daily decay processing endpoint is available at <code>/api/jobs/daily-decay</code> and protected by job secret header.
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            v1 checklist: <code>docs/v1-readiness-checklist.md</code>.
          </p>
        </section>

        <section className="hexis-card p-6">
          <h2 className="text-lg font-semibold">Feedback</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Found friction or ambiguity? Send short product feedback linked to the exact surface.
          </p>
          <Link
            href="/feedback?from=/settings"
            className="mt-3 inline-flex min-h-10 items-center rounded-md border px-3 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            Open feedback form
          </Link>
        </section>
      </div>
    </AppShell>
  );
}

export { SettingsPage as default };
