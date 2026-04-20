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
    <div className="min-h-screen bg-[var(--color-background)] px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <p className="hexis-eyebrow">Step 2 of 2</p>
        <h1 className="mt-2 text-4xl font-semibold">Set your first cultivation direction</h1>
        <p className="mt-3 max-w-3xl text-sm text-[var(--color-muted)]">
          Pick one current priority, then choose a starting template. You can refine this later.
        </p>

        <form action={completeOnboardingAction} className="mt-8 space-y-6">
          <section className="hexis-card p-5">
            <p className="hexis-eyebrow">Cultivation goal</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CULTIVATION_GOAL_OPTIONS.map((goal, index) => (
                <label key={goal.value} className="block cursor-pointer rounded-md border bg-[var(--color-background)] p-4">
                  <input
                    type="radio"
                    name="cultivationGoal"
                    value={goal.value}
                    defaultChecked={index === 0}
                    className="mb-3"
                  />
                  <p className="text-sm font-medium">{goal.label}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{goal.description}</p>
                </label>
              ))}
            </div>
          </section>

          <section className="hexis-card p-5">
            <p className="hexis-eyebrow">Starting template</p>
            <div className="mt-3 grid gap-4 lg:grid-cols-3">
              {templates.map((template) => (
                <label key={template.key} className="block cursor-pointer rounded-md border bg-[var(--color-background)] p-5">
                  <input
                    type="radio"
                    name="templateKey"
                    value={template.key}
                    defaultChecked={template.isDefault}
                    className="mb-4"
                  />
                  <h2 className="text-xl font-semibold">{template.label}</h2>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">{template.description}</p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
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

          <section className="hexis-card p-5">
            <p className="hexis-eyebrow">How Hexis works</p>
            <ul className="mt-3 grid gap-2 text-sm text-[var(--color-muted)] md:grid-cols-2">
              <li>Attributes respond to real evidence over time.</li>
              <li>Current moves fastest, base slower, potential slowest.</li>
              <li>Maintenance keeps current near base.</li>
              <li>Neglect can reduce current and eventually erode base.</li>
              <li>Recommendations help direct your next meaningful block.</li>
            </ul>
          </section>

          <div className="flex justify-end pt-1">
            <button className="min-h-11 rounded-md bg-[var(--color-foreground)] px-5 py-2.5 text-sm font-medium text-[var(--color-background)]">
              Enter dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { OnboardingPage as default };
