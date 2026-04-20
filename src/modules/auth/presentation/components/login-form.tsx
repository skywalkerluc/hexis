"use client";

import { useActionState } from "react";
import { loginFormAction } from "@/modules/auth/presentation/auth.actions";
import { INITIAL_AUTH_FORM_STATE } from "@/modules/auth/presentation/auth-form-state";

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginFormAction, INITIAL_AUTH_FORM_STATE);

  return (
    <form action={action} className="w-full max-w-md space-y-4 rounded-2xl border bg-[var(--color-surface)] p-6 sm:p-8">
      <div>
        <p className="hexis-eyebrow">Hexis</p>
        <h1 className="mt-2 text-3xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Sign in to continue your cultivation practice.</p>
      </div>

      {state.formError ? (
        <div className="rounded-md border border-[var(--color-critical)] px-3 py-2 text-xs text-[var(--color-critical)]">
          {state.formError}
        </div>
      ) : null}

      <label className="block">
        <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Email</span>
        <input
          required
          name="email"
          type="email"
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
          required
          name="password"
          type="password"
          autoComplete="current-password"
          className="mt-1.5 min-h-11 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
        />
        {state.fieldErrors.password ? (
          <p className="mt-1 text-xs text-[var(--color-critical)]">{state.fieldErrors.password}</p>
        ) : null}
      </label>

      <button
        className="min-h-11 w-full rounded-md bg-[var(--color-foreground)] px-4 py-2.5 text-sm font-medium text-[var(--color-background)] disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
