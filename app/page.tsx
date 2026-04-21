import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/shared/auth/server-session";
import { landingCtaAction } from "@/modules/public/presentation/public.actions";

async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    if (user.profile?.onboardingDone) {
      redirect("/dashboard");
    }
    redirect("/onboarding");
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-4 py-10 text-[var(--color-foreground)] sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        <section className="hexis-card p-6 sm:p-8">
          <p className="hexis-eyebrow">Hexis</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Cultivate attributes with evidence, not noise.
          </h1>
          <p className="mt-4 text-sm text-[var(--color-muted)] sm:text-base">
            Hexis helps you track how focus, discipline, energy and related attributes shift over
            time through real evidence, maintenance, and decay-aware feedback.
          </p>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Initial calibration: start from a neutral baseline, then personalize through your first logs.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={landingCtaAction}>
              <input type="hidden" name="target" value="signup" />
              <button className="min-h-11 rounded-md bg-[var(--color-foreground)] px-4 py-2 text-sm text-[var(--color-background)]">
                Create account
              </button>
            </form>
            <form action={landingCtaAction}>
              <input type="hidden" name="target" value="login" />
              <button className="hexis-button-secondary px-4 py-2 text-sm">
                Log in
              </button>
            </form>
          </div>
        </section>

        <section className="hexis-card p-6 sm:p-8">
          <p className="hexis-eyebrow">What to expect</p>
          <ul className="mt-4 space-y-3 text-sm text-[var(--color-muted)]">
            <li>Attributes are visible from 0 to 20, with explainable current/base/potential movement.</li>
            <li>Starting values are calibration anchors, not a score claim about you.</li>
            <li>Evidence logs shape attribute trends and recommendation priority.</li>
            <li>Return summaries and weekly review keep attention on what matters now.</li>
          </ul>
          <p className="mt-5 text-xs text-[var(--color-muted)]">
            By continuing, you agree to product testing terms used for early v1 evaluation.
          </p>
          <div className="mt-3 text-xs text-[var(--color-muted)]">
            <Link href="/login" className="underline underline-offset-2">Existing account</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export { HomePage as default };
