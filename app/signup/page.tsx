import Link from "next/link";
import { SignupForm } from "@/modules/auth/presentation/components/signup-form";
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
        <div className="w-full max-w-md">
          <SignupForm />
          <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
            Already have one? <Link href="/login" className="underline text-[var(--color-foreground)]">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export { SignupPage as default };
