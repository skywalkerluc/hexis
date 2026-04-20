import Link from "next/link";
import { loginAction } from "@/modules/auth/presentation/auth.actions";
import { requireAnonymousUser } from "@/shared/auth/route-guards";

async function LoginPage() {
  await requireAnonymousUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-6">
      <form action={loginAction} className="w-full max-w-md space-y-5 rounded-2xl border bg-[var(--color-surface)] p-8">
        <div>
          <p className="hexis-eyebrow">Hexis</p>
          <h1 className="mt-2 text-3xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Sign in to continue your cultivation practice.</p>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Email</span>
          <input
            required
            name="email"
            type="email"
            className="mt-1.5 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Password</span>
          <input
            required
            name="password"
            type="password"
            className="mt-1.5 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
          />
        </label>

        <button className="w-full rounded-md bg-[var(--color-foreground)] px-4 py-2.5 text-sm font-medium text-[var(--color-background)]">
          Sign in
        </button>

        <p className="text-center text-xs text-[var(--color-muted)]">
          New to Hexis? <Link href="/signup" className="text-[var(--color-foreground)] underline">Create account</Link>
        </p>
      </form>
    </div>
  );
}

export { LoginPage as default };
