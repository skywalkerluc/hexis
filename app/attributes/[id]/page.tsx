import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { AttributeScale } from "@/modules/shared/presentation/components/attribute-scale";
import { StatusBadge } from "@/modules/shared/presentation/components/status-badge";
import { readUserAttributeDetail } from "@/modules/attributes/application/read-attributes.query";
import { readAttributeHistory } from "@/modules/evidence/application/read-history.query";
import { requireOnboardedUser } from "@/shared/auth/route-guards";

async function AttributeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireOnboardedUser();
  const resolvedParams = await params;
  const attribute = await readUserAttributeDetail(user.id, resolvedParams.id);

  if (!attribute) {
    notFound();
  }

  const history = await readAttributeHistory(user.id, attribute.userAttributeId);

  return (
    <AppShell
      title={attribute.name}
      eyebrow={attribute.shortCode}
      currentPath="/attributes"
      displayName={user.profile?.displayName ?? user.email}
      actions={
        <Link href="/log" className="rounded-md bg-[var(--color-foreground)] px-3 py-2 text-sm text-[var(--color-background)]">
          Log practice
        </Link>
      }
    >
      <Link href="/attributes" className="text-sm text-[var(--color-muted)]">← All attributes</Link>

      <section className="hexis-card mt-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">{attribute.name}</h2>
            <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">{attribute.description}</p>
          </div>
          <StatusBadge status={attribute.status} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Metric label="Current" value={attribute.currentValue.toFixed(1)} />
          <Metric label="Base" value={attribute.baseValue.toFixed(1)} />
          <Metric label="Potential" value={attribute.potentialValue.toFixed(1)} />
        </div>

        <div className="mt-5">
          <AttributeScale
            currentValue={attribute.currentValue}
            baseValue={attribute.baseValue}
            potentialValue={attribute.potentialValue}
          />
        </div>
      </section>

      <section className="hexis-card mt-6 p-6">
        <p className="hexis-eyebrow">History log</p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">Every change includes a cause and explicit deltas.</p>

        <ul className="mt-4 space-y-3">
          {history.map((entry) => (
            <li key={entry.id} className="rounded-md border bg-[var(--color-background)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">{entry.causeType}</p>
                <p className="text-xs text-[var(--color-muted)]">{entry.changedAt.toLocaleString()}</p>
              </div>
              <p className="mt-2 text-sm">{entry.explanation}</p>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                Current {entry.previousCurrent.toFixed(2)} → {entry.nextCurrent.toFixed(2)} · Base {entry.previousBase.toFixed(2)} → {entry.nextBase.toFixed(2)} · Potential {entry.previousPotential.toFixed(2)} → {entry.nextPotential.toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-[var(--color-background)] p-4">
      <p className="hexis-eyebrow">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default AttributeDetailPage;
