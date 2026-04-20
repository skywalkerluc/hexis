"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[var(--color-background)] px-4 py-10 text-[var(--color-foreground)] sm:px-6 lg:px-10">
      <section className="hexis-card mx-auto max-w-2xl p-6 sm:p-8">
        <p className="hexis-eyebrow">Unexpected issue</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Hexis could not load this view.</h1>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Try again. If this continues, send feedback so we can trace the failure quickly.
        </p>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Ref: {error.digest ?? "no-digest"}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={reset}
            className="min-h-11 rounded-md bg-[var(--color-foreground)] px-4 py-2 text-sm text-[var(--color-background)]"
          >
            Retry
          </button>
          <Link
            href="/feedback?from=/error"
            className="min-h-11 rounded-md border px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            Send feedback
          </Link>
        </div>
      </section>
    </main>
  );
}
