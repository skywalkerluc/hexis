import Link from "next/link";
import { signupAction } from "@/modules/auth/presentation/auth.actions";
import { requireAnonymousUser } from "@/shared/auth/route-guards";

async function SignupPage() {
  await requireAnonymousUser();

  return (
    <div className="grid min-h-screen bg-[var(--color-background)] lg:grid-cols-2">
      <aside className="hidden border-r p-10 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="hexis-eyebrow">Hexis</p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight">
            Build durable attributes with clear evidence.
          </h1>
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          No synthetic leveling loops. Real logs, explainable change, calm execution.
        </p>
      </aside>

      <main className="flex items-center justify-center px-6 py-10">
        <form action={signupAction} className="w-full max-w-md space-y-5 rounded-2xl border bg-[var(--color-surface)] p-8">
          <div>
            <p className="hexis-eyebrow">Step 1 of 2</p>
            <h2 className="mt-2 text-3xl font-semibold">Create account</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Already have one? <Link href="/login" className="underline text-[var(--color-foreground)]">Sign in</Link>
            </p>
          </div>

          <Field label="Display name" name="displayName" type="text" required />
          <Field label="Email" name="email" type="email" required />
          <Field label="Password" name="password" type="password" required minLength={12} />

          <button className="w-full rounded-md bg-[var(--color-foreground)] px-4 py-2.5 text-sm font-medium text-[var(--color-background)]">
            Continue
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  required,
  minLength,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        className="mt-1.5 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
      />
    </label>
  );
}

export { SignupPage as default };
