import { completeOnboardingAction } from "@/modules/onboarding/presentation/onboarding.actions";
import { readOnboardingTemplates } from "@/modules/onboarding/application/read-onboarding-data.query";
import { requireAppUser } from "@/shared/auth/route-guards";
import { redirect } from "next/navigation";

async function OnboardingPage() {
  const user = await requireAppUser();
  if (user.profile?.onboardingDone) {
    redirect("/dashboard");
  }

  const templates = await readOnboardingTemplates();

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <p className="hexis-eyebrow">Step 2 of 2</p>
        <h1 className="mt-2 text-4xl font-semibold">Choose your starting template</h1>
        <p className="mt-3 max-w-3xl text-sm text-[var(--color-muted)]">
          Templates shape emphasis, not identity. You can refine them later.
        </p>

        <form action={completeOnboardingAction} className="mt-8 grid gap-4 lg:grid-cols-3">
          {templates.map((template) => (
            <label key={template.key} className="hexis-card block cursor-pointer p-5">
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

          <div className="lg:col-span-3 flex justify-end pt-4">
            <button className="rounded-md bg-[var(--color-foreground)] px-5 py-2.5 text-sm font-medium text-[var(--color-background)]">
              Enter dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { OnboardingPage as default };
