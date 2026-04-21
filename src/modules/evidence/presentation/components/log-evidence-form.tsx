"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { UserAttributeView } from "@/modules/attributes/application/read-attributes.query";
import { submitEvidenceEventAction } from "@/modules/evidence/presentation/evidence.actions";
import {
  INITIAL_LOG_EVIDENCE_FORM_STATE,
  type LogEvidenceFormState,
} from "@/modules/evidence/presentation/evidence.types";

const EVENT_TYPES = [
  {
    value: "TRAINING",
    label: "Training",
    description: "Deliberate work on skill strength and consistency.",
  },
  {
    value: "PRACTICE",
    label: "Practice",
    description: "Short focused repetitions to retain sharpness.",
  },
  {
    value: "ROUTINE",
    label: "Routine",
    description: "Maintenance habits that prevent drift.",
  },
  {
    value: "ACHIEVEMENT",
    label: "Achievement",
    description: "A meaningful result that confirms execution quality.",
  },
  {
    value: "RECOVERY",
    label: "Recovery",
    description: "Restorative behavior that protects sustainable output.",
  },
] as const;

const INTENSITIES = [
  { value: "LIGHT", label: "Light", description: "Low load, consistency-oriented." },
  { value: "MODERATE", label: "Moderate", description: "Balanced training load." },
  { value: "INTENSE", label: "Intense", description: "High effort and adaptation demand." },
] as const;

const SUGGESTED_ATTRIBUTE_SLUGS: Record<string, readonly string[]> = {
  TRAINING: ["focus", "discipline", "memory", "organization"],
  PRACTICE: ["focus", "memory", "creativity"],
  ROUTINE: ["discipline", "organization", "energy"],
  ACHIEVEMENT: ["leadership", "discipline", "resilience"],
  RECOVERY: ["energy", "resilience", "emotional-control", "physical-endurance"],
};

const DEFAULT_EVENT_TYPE = "TRAINING";
const DEFAULT_INTENSITY = "MODERATE";
const IMPACT_PREVIEW_LIMIT = 5;
const GOAL_SUGGESTION_LIMIT = 3;
const SUCCESS_IMPACT_PREVIEW_LIMIT = 3;

type GoalGuidance = {
  label: string;
  focusAttributeSlugs: readonly string[];
  suggestedEventType: "TRAINING" | "PRACTICE" | "ROUTINE" | "ACHIEVEMENT" | "RECOVERY";
};

function formatForDateTimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function inlineErrorMessage(
  state: LogEvidenceFormState,
  field: keyof LogEvidenceFormState["fieldErrors"],
): string | null {
  const message = state.fieldErrors[field];
  return message ?? null;
}

export function LogEvidenceForm({
  attributes,
  goalGuidance,
}: {
  attributes: UserAttributeView[];
  goalGuidance: GoalGuidance | null;
}) {
  function suggestedSelectionForEventType(targetEventType: string): Set<string> {
    const goalSuggestion = goalGuidance?.focusAttributeSlugs ?? [];
    const eventSuggestion = SUGGESTED_ATTRIBUTE_SLUGS[targetEventType] ?? [];
    const suggestionSource =
      goalSuggestion.length > 0
        ? Array.from(new Set([...goalSuggestion, ...eventSuggestion]))
        : eventSuggestion;
    const suggested = new Set(suggestionSource);
    return new Set(
      attributes
        .filter((attribute) => suggested.has(attribute.slug))
        .map((attribute) => attribute.userAttributeId),
    );
  }

  const [state, formAction, isPending] = useActionState(
    submitEvidenceEventAction,
    INITIAL_LOG_EVIDENCE_FORM_STATE,
  );
  const initialEventType = goalGuidance?.suggestedEventType ?? DEFAULT_EVENT_TYPE;
  const [eventType, setEventType] = useState<string>(initialEventType);
  const [intensity, setIntensity] = useState<string>(DEFAULT_INTENSITY);
  const [hideSuccess, setHideSuccess] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const timingSectionRef = useRef<HTMLDivElement | null>(null);
  const attributesSectionRef = useRef<HTMLDivElement | null>(null);
  const narrativeSectionRef = useRef<HTMLDivElement | null>(null);
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<Set<string>>(() =>
    suggestedSelectionForEventType(initialEventType),
  );

  const suggestionSet = useMemo(
    () =>
      new Set([
        ...(SUGGESTED_ATTRIBUTE_SLUGS[eventType] ?? []),
        ...(goalGuidance?.focusAttributeSlugs ?? []),
      ]),
    [eventType, goalGuidance?.focusAttributeSlugs],
  );

  const selectedAttributes = useMemo(
    () => attributes.filter((attribute) => selectedAttributeIds.has(attribute.userAttributeId)),
    [attributes, selectedAttributeIds],
  );

  const intensityLabel = INTENSITIES.find((item) => item.value === intensity)?.label ?? "Moderate";
  const occurredAtDefault = useMemo(() => formatForDateTimeLocal(new Date()), []);
  const hasOccurredAtError = Boolean(inlineErrorMessage(state, "occurredAt"));
  const hasAttributeError = Boolean(inlineErrorMessage(state, "attributes"));
  const hasTitleError = Boolean(inlineErrorMessage(state, "title"));
  const hasAnyFieldError = hasOccurredAtError || hasAttributeError || hasTitleError;

  useEffect(() => {
    if (state.status !== "error") {
      return;
    }
    if (hasOccurredAtError) {
      timingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (hasAttributeError) {
      attributesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (hasTitleError) {
      narrativeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [hasAttributeError, hasOccurredAtError, hasTitleError, state.status]);

  useEffect(() => {
    if (state.status === "success") {
      setHideSuccess(false);
    }
  }, [state.status, state.successSummary?.occurredAt]);

  function toggleAttribute(attributeId: string): void {
    setSelectedAttributeIds((previous) => {
      const next = new Set(previous);
      if (next.has(attributeId)) {
        next.delete(attributeId);
      } else {
        next.add(attributeId);
      }
      return next;
    });
  }

  function applySuggestedSelection(): void {
    setSelectedAttributeIds(
      new Set(
        attributes
          .filter((attribute) => suggestionSet.has(attribute.slug))
          .map((attribute) => attribute.userAttributeId),
      ),
    );
  }

  function clearSelection(): void {
    setSelectedAttributeIds(new Set());
  }

  return (
    <form ref={formRef} action={formAction} className="grid gap-5 lg:grid-cols-12 lg:gap-6">
      {state.formError ? (
        <div className="lg:col-span-12 rounded-md border border-[var(--color-critical)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-[var(--color-foreground)]">
          <p>{state.formError}</p>
          {hasAnyFieldError ? (
            <p className="mt-1 text-xs text-[var(--color-muted)]">Review the highlighted sections below.</p>
          ) : null}
        </div>
      ) : null}

      {state.status === "success" && state.successSummary && !hideSuccess ? (
        <div className="lg:col-span-12 rounded-md border border-[var(--color-teal)] bg-[var(--color-surface-raised)] px-4 py-3">
          <p className="text-sm font-medium">Evidence recorded</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {state.successSummary.title} · {state.successSummary.eventType} · {state.successSummary.intensity} · {state.successSummary.occurredAt}
          </p>
          {state.successSummary.impacts.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs text-[var(--color-muted)]">
              {state.successSummary.impacts
                .slice(0, SUCCESS_IMPACT_PREVIEW_LIMIT)
                .map((impact: { attributeName: string; deltaCurrent: number }) => (
                <li key={impact.attributeName}>
                  {impact.attributeName}: {impact.deltaCurrent >= 0 ? "+" : ""}
                  {impact.deltaCurrent.toFixed(2)} current
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link href="/dashboard" className="hexis-button-secondary px-3 py-2 text-xs">
              Continue to dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                formRef.current?.reset();
                setSelectedAttributeIds(suggestedSelectionForEventType(initialEventType));
                setEventType(initialEventType);
                setIntensity(DEFAULT_INTENSITY);
                setHideSuccess(true);
              }}
              className="inline-flex min-h-10 items-center rounded-md border border-[var(--color-teal)] px-3 py-2 text-xs text-[var(--color-teal)] hover:bg-[var(--color-surface-raised)]"
            >
              Log another
            </button>
          </div>
          <Link href="/history?logged=1" className="mt-2 inline-block text-xs text-[var(--color-muted)] underline underline-offset-2">
            Review full history
          </Link>
        </div>
      ) : null}

      <section className="space-y-4 lg:col-span-8 lg:space-y-5">
        <div className="hexis-card p-4 sm:p-5">
          <p className="hexis-eyebrow">Evidence type</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {EVENT_TYPES.map((item) => {
              const active = eventType === item.value;
              return (
                <label
                  key={item.value}
                  className="cursor-pointer rounded-md border p-3"
                  style={{
                    borderColor: active ? "var(--color-gold)" : "var(--color-hairline)",
                    background: active ? "var(--color-surface-raised)" : "var(--color-background)",
                  }}
                >
                  <input
                    type="radio"
                    name="eventType"
                    value={item.value}
                    checked={active}
                    onChange={() => setEventType(item.value)}
                    className="sr-only"
                  />
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{item.description}</p>
                </label>
              );
            })}
          </div>
        </div>

        <div
          className="hexis-card p-4 sm:p-5"
          style={{
            borderColor: hasTitleError ? "var(--color-critical)" : "var(--color-hairline)",
            background: hasTitleError
              ? "color-mix(in oklab, var(--color-critical) 7%, var(--color-surface))"
              : "var(--color-surface)",
          }}
          ref={narrativeSectionRef}
        >
          <p className="hexis-eyebrow">What happened</p>
          <label className="mt-2 block">
            <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Title</span>
            <input
              required
              name="title"
              className="mt-1.5 min-h-11 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
              placeholder="e.g. 90-minute deep work block"
            />
            {inlineErrorMessage(state, "title") ? (
              <p className="mt-1 text-xs text-[var(--color-critical)]">
                {inlineErrorMessage(state, "title")}
              </p>
            ) : null}
          </label>

          <details className="mt-4 rounded-md border bg-[var(--color-background)] p-3">
            <summary className="cursor-pointer text-xs uppercase tracking-wider text-[var(--color-muted)]">
              Add notes (optional)
            </summary>
            <label className="mt-3 block">
              <textarea
                name="notes"
                rows={4}
                className="w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
                placeholder="What made this work, what to repeat next time"
              />
            </label>
          </details>
        </div>

        <div
          className="hexis-card p-4 sm:p-5"
          style={{
            borderColor: hasOccurredAtError ? "var(--color-critical)" : "var(--color-hairline)",
            background: hasOccurredAtError
              ? "color-mix(in oklab, var(--color-critical) 7%, var(--color-surface))"
              : "var(--color-surface)",
          }}
          ref={timingSectionRef}
        >
          <details>
            <summary className="cursor-pointer text-xs uppercase tracking-wider text-[var(--color-muted)]">
              Adjust load and timing (optional)
            </summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Intensity</span>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {INTENSITIES.map((item) => {
                    const active = intensity === item.value;
                    return (
                      <label
                        key={item.value}
                        className="cursor-pointer rounded-md border px-3 py-2 text-center text-xs"
                        style={{
                          borderColor: active ? "var(--color-teal)" : "var(--color-hairline)",
                          color: active ? "var(--color-foreground)" : "var(--color-muted)",
                          background: active ? "var(--color-surface-raised)" : "var(--color-background)",
                        }}
                      >
                        <input
                          type="radio"
                          name="intensity"
                          value={item.value}
                          checked={active}
                          onChange={() => setIntensity(item.value)}
                          className="sr-only"
                        />
                        {item.label}
                      </label>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  {INTENSITIES.find((item) => item.value === intensity)?.description}
                </p>
              </div>

              <label>
                <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Occurred at</span>
                <input
                  required
                  name="occurredAt"
                  type="datetime-local"
                  defaultValue={occurredAtDefault}
                  className="mt-1.5 min-h-11 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
                />
                {inlineErrorMessage(state, "occurredAt") ? (
                  <p className="mt-1 text-xs text-[var(--color-critical)]">
                    {inlineErrorMessage(state, "occurredAt")}
                  </p>
                ) : null}
              </label>
            </div>
          </details>
        </div>

        <div
          className="hexis-card p-4 sm:p-5"
          style={{
            borderColor: hasAttributeError ? "var(--color-critical)" : "var(--color-hairline)",
            background: hasAttributeError
              ? "color-mix(in oklab, var(--color-critical) 7%, var(--color-surface))"
              : "var(--color-surface)",
          }}
          ref={attributesSectionRef}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="hexis-eyebrow">Affected attributes</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={applySuggestedSelection}
                className="hexis-button-secondary px-2.5 py-1.5 text-xs"
              >
                Use suggested
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="hexis-button-secondary px-2.5 py-1.5 text-xs"
              >
                Clear
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Suggested for {EVENT_TYPES.find((item) => item.value === eventType)?.label}: {attributes
              .filter((attribute) => suggestionSet.has(attribute.slug))
              .map((attribute) => attribute.name)
              .join(", ") || "No suggestions"}
          </p>
          {goalGuidance ? (
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Goal priority ({goalGuidance.label}): {attributes
                .filter((attribute) => goalGuidance.focusAttributeSlugs.includes(attribute.slug))
                .slice(0, GOAL_SUGGESTION_LIMIT)
                .map((attribute) => attribute.name)
                .join(", ") || "No direct mapping"}
            </p>
          ) : null}

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {attributes.map((attribute) => {
              const selected = selectedAttributeIds.has(attribute.userAttributeId);
              const suggested = suggestionSet.has(attribute.slug);
              return (
                <label
                  key={attribute.userAttributeId}
                  className="flex cursor-pointer items-center justify-between rounded-md border px-3 py-2"
                  style={{
                    borderColor: selected ? "var(--color-gold)" : "var(--color-hairline)",
                    background: selected ? "var(--color-surface-raised)" : "var(--color-background)",
                  }}
                >
                  <span className="text-sm">
                    {attribute.name}
                    {suggested ? (
                      <span className="ml-1 text-[10px] uppercase tracking-wide text-[var(--color-teal)]">suggested</span>
                    ) : null}
                  </span>
                  <input
                    type="checkbox"
                    name="attributeId"
                    value={attribute.userAttributeId}
                    checked={selected}
                    onChange={() => toggleAttribute(attribute.userAttributeId)}
                    className="h-4 w-4"
                  />
                </label>
              );
            })}
          </div>
          {inlineErrorMessage(state, "attributes") ? (
            <p className="mt-2 text-xs text-[var(--color-critical)]">
              {inlineErrorMessage(state, "attributes")}
            </p>
          ) : null}
        </div>

        <div className="lg:hidden">
          <button
            disabled={selectedAttributes.length === 0 || isPending}
            className="min-h-11 w-full rounded-md bg-[var(--color-foreground)] px-4 py-3 text-sm font-medium text-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? "Recording..." : "Record evidence"}
          </button>
        </div>
      </section>

      <aside className="lg:col-span-4">
        <div className="hexis-card p-4 sm:p-5 lg:sticky lg:top-24">
          <p className="hexis-eyebrow">Impact summary</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {selectedAttributes.length === 0
              ? "Select at least one attribute to log meaningful evidence."
              : `${EVENT_TYPES.find((item) => item.value === eventType)?.label} · ${intensityLabel} · ${selectedAttributes.length} attribute(s).`}
          </p>
          {selectedAttributes.length > 0 ? (
            <ul className="mt-3 space-y-1.5 text-xs text-[var(--color-muted)]">
              {selectedAttributes.slice(0, IMPACT_PREVIEW_LIMIT).map((attribute) => (
                <li key={attribute.userAttributeId}>{attribute.name}</li>
              ))}
              {selectedAttributes.length > IMPACT_PREVIEW_LIMIT ? (
                <li>+{selectedAttributes.length - IMPACT_PREVIEW_LIMIT} more</li>
              ) : null}
            </ul>
          ) : null}
          <p className="mt-4 text-xs text-[var(--color-muted)]">
            Submission persists event, attribute impacts and explainable history in one atomic flow.
          </p>
          <button
            disabled={selectedAttributes.length === 0 || isPending}
            className="mt-5 min-h-11 w-full rounded-md bg-[var(--color-foreground)] px-4 py-3 text-sm font-medium text-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? "Recording..." : "Record evidence"}
          </button>
        </div>
      </aside>
    </form>
  );
}
