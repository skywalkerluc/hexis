"use client";

import { useActionState, useMemo } from "react";
import {
  FEEDBACK_CATEGORY_OPTIONS,
  FEEDBACK_INITIAL_STATE,
  submitFeedbackAction,
} from "@/modules/feedback/presentation/feedback.actions";

type FeedbackFormProps = {
  routePath: string;
};

export function FeedbackForm({ routePath }: FeedbackFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitFeedbackAction,
    FEEDBACK_INITIAL_STATE,
  );
  const feedbackClass = useMemo(() => {
    if (state.status === "success") {
      return "border-[var(--color-teal)]/60 text-[var(--color-teal)]";
    }
    if (state.status === "error") {
      return "border-red-500/60 text-red-300";
    }
    return "border-[var(--color-hairline)] text-[var(--color-muted)]";
  }, [state.status]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="routePath" value={routePath} />

      <label className="block">
        <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Type</span>
        <select
          name="category"
          defaultValue={FEEDBACK_CATEGORY_OPTIONS[0]?.value}
          className="mt-1.5 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
          disabled={isPending}
        >
          {FEEDBACK_CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Feedback</span>
        <textarea
          name="message"
          rows={5}
          maxLength={600}
          placeholder="What felt unclear, slow, or useful?"
          className="mt-1.5 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
          disabled={isPending}
          required
        />
      </label>

      <div className={`rounded-md border px-3 py-2 text-xs ${feedbackClass}`}>
        {state.message ?? "Short, concrete feedback is the most useful."}
      </div>

      <button
        type="submit"
        className="min-h-11 rounded-md bg-[var(--color-foreground)] px-4 py-2 text-sm text-[var(--color-background)] disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? "Sending..." : "Send feedback"}
      </button>
    </form>
  );
}
