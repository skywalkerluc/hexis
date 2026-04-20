"use client";

import { useMemo, useState } from "react";
import type { UserAttributeView } from "@/modules/attributes/application/read-attributes.query";

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

function formatForDateTimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function LogEvidenceForm({
  attributes,
  action,
}: {
  attributes: UserAttributeView[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [eventType, setEventType] = useState<string>(DEFAULT_EVENT_TYPE);
  const [intensity, setIntensity] = useState<string>(DEFAULT_INTENSITY);
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<Set<string>>(
    () => {
      const suggested = new Set(SUGGESTED_ATTRIBUTE_SLUGS[DEFAULT_EVENT_TYPE] ?? []);
      return new Set(
        attributes
          .filter((attribute) => suggested.has(attribute.slug))
          .map((attribute) => attribute.userAttributeId),
      );
    },
  );

  const suggestionSet = useMemo(
    () => new Set(SUGGESTED_ATTRIBUTE_SLUGS[eventType] ?? []),
    [eventType],
  );

  const selectedAttributes = useMemo(
    () => attributes.filter((attribute) => selectedAttributeIds.has(attribute.userAttributeId)),
    [attributes, selectedAttributeIds],
  );

  const intensityLabel = INTENSITIES.find((item) => item.value === intensity)?.label ?? "Moderate";
  const occurredAtDefault = useMemo(() => formatForDateTimeLocal(new Date()), []);

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
    <form action={action} className="grid gap-6 lg:grid-cols-12">
      <section className="space-y-5 lg:col-span-8">
        <div className="hexis-card p-5">
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

        <div className="hexis-card p-5">
          <p className="hexis-eyebrow">Load and timing</p>
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
                className="mt-1.5 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>

        <div className="hexis-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="hexis-eyebrow">Affected attributes</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={applySuggestedSelection}
                className="rounded-md border px-2.5 py-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              >
                Use suggested
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-md border px-2.5 py-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
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
                  />
                </label>
              );
            })}
          </div>
        </div>

        <div className="hexis-card p-5">
          <p className="hexis-eyebrow">Narrative</p>
          <label className="mt-3 block">
            <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Title</span>
            <input
              required
              name="title"
              className="mt-1.5 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
              placeholder="e.g. 90-minute deep work block"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Notes</span>
            <textarea
              name="notes"
              rows={4}
              className="mt-1.5 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
              placeholder="What you did, what made it work, what to repeat next time"
            />
          </label>
        </div>
      </section>

      <aside className="lg:col-span-4">
        <div className="hexis-card sticky top-24 p-5">
          <p className="hexis-eyebrow">Impact summary</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {selectedAttributes.length === 0
              ? "Select at least one attribute to log meaningful evidence."
              : `${EVENT_TYPES.find((item) => item.value === eventType)?.label} · ${intensityLabel} · ${selectedAttributes.length} attribute(s).`}
          </p>
          {selectedAttributes.length > 0 ? (
            <ul className="mt-3 space-y-1.5 text-xs text-[var(--color-muted)]">
              {selectedAttributes.slice(0, 5).map((attribute) => (
                <li key={attribute.userAttributeId}>{attribute.name}</li>
              ))}
              {selectedAttributes.length > 5 ? (
                <li>+{selectedAttributes.length - 5} more</li>
              ) : null}
            </ul>
          ) : null}
          <p className="mt-4 text-xs text-[var(--color-muted)]">
            Submission persists event, attribute impacts and explainable history in one atomic flow.
          </p>
          <button
            disabled={selectedAttributes.length === 0}
            className="mt-5 w-full rounded-md bg-[var(--color-foreground)] px-4 py-2.5 text-sm font-medium text-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Record evidence
          </button>
        </div>
      </aside>
    </form>
  );
}
