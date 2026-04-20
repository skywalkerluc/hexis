"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { signupFormAction } from "@/modules/auth/presentation/auth.actions";
import { INITIAL_AUTH_FORM_STATE } from "@/modules/auth/presentation/auth-form-state";
import { PASSWORD_MIN_LENGTH } from "@/modules/auth/domain/auth.constants";

const PASSWORD_RULES = [
  {
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (value: string) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    label: "One uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    label: "One lowercase letter",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    label: "One number",
    test: (value: string) => /\d/.test(value),
  },
] as const;

export function SignupForm() {
  const [state, action, isPending] = useActionState(signupFormAction, INITIAL_AUTH_FORM_STATE);
  const [password, setPassword] = useState<string>("");

  const passwordChecks = useMemo(
    () => PASSWORD_RULES.map((rule) => ({
      label: rule.label,
      passed: rule.test(password),
    })),
    [password],
  );

  return (
    <form action={action} className="w-full max-w-md space-y-4 rounded-2xl border bg-[var(--color-surface)] p-6 sm:p-8">
      <div>
        <p className="hexis-eyebrow">Step 1 of 2</p>
        <h2 className="mt-2 text-3xl font-semibold">Create account</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Already have one? <Link href="/login" className="underline text-[var(--color-foreground)]">Sign in</Link>
        </p>
      </div>

      {state.formError ? (
        <div className="rounded-md border border-[var(--color-critical)] px-3 py-2 text-xs text-[var(--color-critical)]">
          {state.formError}
        </div>
      ) : null}

      <label className="block">
        <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Display name</span>
        <input
          name="displayName"
          type="text"
          required
          autoComplete="name"
          className="mt-1.5 min-h-11 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
        />
        {state.fieldErrors.displayName ? (
          <p className="mt-1 text-xs text-[var(--color-critical)]">{state.fieldErrors.displayName}</p>
        ) : null}
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1.5 min-h-11 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
        />
        {state.fieldErrors.email ? (
          <p className="mt-1 text-xs text-[var(--color-critical)]">{state.fieldErrors.email}</p>
        ) : null}
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1.5 min-h-11 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
        />
        {state.fieldErrors.password ? (
          <p className="mt-1 text-xs text-[var(--color-critical)]">{state.fieldErrors.password}</p>
        ) : null}
      </label>

      <ul className="rounded-md border bg-[var(--color-background)] p-3 text-xs text-[var(--color-muted)]">
        {passwordChecks.map((rule) => (
          <li key={rule.label} className="flex items-center gap-2 py-0.5">
            <span className={rule.passed ? "text-[var(--color-teal)]" : "text-[var(--color-muted)]"}>
              {rule.passed ? "●" : "○"}
            </span>
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>

      <button
        className="min-h-11 w-full rounded-md bg-[var(--color-foreground)] px-4 py-2.5 text-sm font-medium text-[var(--color-background)] disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? "Creating account..." : "Continue"}
      </button>
    </form>
  );
}
