import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { readUserAttributes } from "@/modules/attributes/application/read-attributes.query";
import { createEvidenceEventAction } from "@/modules/evidence/presentation/evidence.actions";
import { requireOnboardedUser } from "@/shared/auth/route-guards";

const EVENT_TYPES: readonly { value: string; label: string }[] = [
  { value: "TRAINING", label: "Training" },
  { value: "PRACTICE", label: "Practice" },
  { value: "ROUTINE", label: "Routine" },
  { value: "ACHIEVEMENT", label: "Achievement" },
  { value: "RECOVERY", label: "Recovery" },
] as const;

const INTENSITIES: readonly { value: string; label: string }[] = [
  { value: "LIGHT", label: "Light" },
  { value: "MODERATE", label: "Moderate" },
  { value: "INTENSE", label: "Intense" },
] as const;

async function LogPage() {
  const user = await requireOnboardedUser();
  const attributes = await readUserAttributes(user.id);

  return (
    <AppShell
      title="Log evidence"
      eyebrow="Evidence"
      currentPath="/log"
      displayName={user.profile?.displayName ?? user.email}
    >
      <form action={createEvidenceEventAction} className="grid gap-6 lg:grid-cols-12">
        <section className="space-y-5 lg:col-span-8">
          <div className="hexis-card p-5">
            <p className="hexis-eyebrow">What happened</p>
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
                placeholder="Optional context for later review"
              />
            </label>
          </div>

          <div className="hexis-card p-5">
            <p className="hexis-eyebrow">Classification</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Event type</span>
                <select name="eventType" className="mt-1.5 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm">
                  {EVENT_TYPES.map((eventType) => (
                    <option key={eventType.value} value={eventType.value}>{eventType.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Intensity</span>
                <select name="intensity" className="mt-1.5 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm">
                  {INTENSITIES.map((intensity) => (
                    <option key={intensity.value} value={intensity.value}>{intensity.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 block">
              <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Occurred at</span>
              <input
                required
                name="occurredAt"
                type="datetime-local"
                className="mt-1.5 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="hexis-card p-5">
            <p className="hexis-eyebrow">Affected attributes</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {attributes.map((attribute) => (
                <label key={attribute.userAttributeId} className="flex items-center justify-between rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm">
                  <span>{attribute.name}</span>
                  <input type="checkbox" name="attributeId" value={attribute.userAttributeId} defaultChecked={attribute.slug === "focus"} />
                </label>
              ))}
            </div>
          </div>
        </section>

        <aside className="lg:col-span-4">
          <div className="hexis-card sticky top-24 p-5">
            <p className="hexis-eyebrow">Submit</p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">This will update current/base/potential values and create explainable history logs.</p>
            <button className="mt-5 w-full rounded-md bg-[var(--color-foreground)] px-4 py-2.5 text-sm font-medium text-[var(--color-background)]">
              Record evidence
            </button>
          </div>
        </aside>
      </form>
    </AppShell>
  );
}

export { LogPage as default };
