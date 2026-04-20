import { completeOnboardingAction } from "@/modules/onboarding/presentation/onboarding.actions";
import { readOnboardingTemplates } from "@/modules/onboarding/application/read-onboarding-data.query";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import { PRODUCT_EVENT_NAME } from "@/modules/analytics/domain/product-event-catalog";
import { CULTIVATION_GOAL_OPTIONS } from "@/modules/onboarding/domain/cultivation-goal";
import { requireAppUser } from "@/shared/auth/route-guards";
import { redirect } from "next/navigation";

async function OnboardingPage() {
  const user = await requireAppUser();
  if (user.profile?.onboardingDone) {
    redirect("/dashboard");
  }

  const templates = await readOnboardingTemplates();
  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.ONBOARDING_STARTED,
    userId: user.id,
    properties: {
      entryPoint: "onboarding_page",
    },
  });

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-4 py-8 pb-28 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <p className="hexis-eyebrow">Step 2 of 2</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-4xl">Set your first cultivation direction</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">
          Pick one current priority, then choose a starting template. You can refine this later.
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">About 1 minute to finish.</p>

        <form id="onboarding-form" action={completeOnboardingAction} className="mt-6 space-y-4 sm:space-y-6">
          <section className="hexis-card p-4 sm:p-5">
            <p className="hexis-eyebrow">Cultivation goal</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {CULTIVATION_GOAL_OPTIONS.map((goal, index) => (
                <label key={goal.value} className="block cursor-pointer rounded-md border bg-[var(--color-background)] p-3 sm:p-4">
                  <input
                    type="radio"
                    name="cultivationGoal"
                    value={goal.value}
                    defaultChecked={index === 0}
                    className="mb-2"
                  />
                  <p className="text-sm font-medium">{goal.label}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{goal.description}</p>
                </label>
              ))}
            </div>
          </section>

          <section className="hexis-card p-4 sm:p-5">
            <p className="hexis-eyebrow">Starting template</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              {templates.map((template) => (
                <label key={template.key} className="block cursor-pointer rounded-md border bg-[var(--color-background)] p-4">
                  <input
                    type="radio"
                    name="templateKey"
                    value={template.key}
                    defaultChecked={template.isDefault}
                    className="mb-2"
                  />
                  <h2 className="text-lg font-semibold">{template.label}</h2>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{template.description}</p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {template.attributes.map((attribute) => (
                      <li key={attribute} className="rounded-full border px-2 py-0.5 text-[11px] text-[var(--color-muted)]">
                        {attribute}
                      </li>
                    ))}
                  </ul>
                </label>
              ))}
            </div>
          </section>

          <section className="hexis-card p-4 sm:p-5">
            <p className="hexis-eyebrow">How Hexis works</p>
            <ul className="mt-2 grid gap-1.5 text-xs sm:text-sm text-[var(--color-muted)] md:grid-cols-2">
              <li>Attributes respond to real evidence over time.</li>
              <li>Current moves fastest, base slower, potential slowest.</li>
              <li>Maintenance keeps current near base.</li>
              <li>Neglect can reduce current and eventually erode base.</li>
              <li>Recommendations help direct your next meaningful block.</li>
            </ul>
          </section>

          <div className="hidden justify-end pt-1 sm:flex">
            <button className="min-h-11 rounded-md bg-[var(--color-foreground)] px-5 py-2.5 text-sm font-medium text-[var(--color-background)]">
              Enter dashboard
            </button>
          </div>
        </form>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-[var(--color-surface)]/95 px-4 py-3 backdrop-blur sm:hidden">
        <button
          form="onboarding-form"
          className="min-h-11 w-full rounded-md bg-[var(--color-foreground)] px-5 py-2.5 text-sm font-medium text-[var(--color-background)]"
        >
          Enter dashboard
        </button>
      </div>
    </div>
  );
}

export { OnboardingPage as default };
