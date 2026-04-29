import Link from "next/link";
import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { AttributeScale } from "@/modules/shared/presentation/components/attribute-scale";
import { StatusBadge } from "@/modules/shared/presentation/components/status-badge";
import { readUserAttributes } from "@/modules/attributes/application/read-attributes.query";
import { requireOnboardedUser } from "@/shared/auth/route-guards";

async function AttributesPage() {
  const user = await requireOnboardedUser();
  const attributes = await readUserAttributes(user.id);

  return (
    <AppShell
      title="Habilidades"
      eyebrow="Ficha"
      currentPath="/attributes"
      displayName={user.profile?.displayName ?? user.email}
    >
      <p className="max-w-2xl text-sm" style={{ color: "var(--color-muted)" }}>
        Cada habilidade tem dinâmicas independentes: atual move mais rápido, base move mais devagar,
        potencial move mais lento.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {attributes.map((attribute) => (
          <Link key={attribute.slug} href={`/attributes/${attribute.slug}`} className="hexis-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">{attribute.shortCode}</p>
                <h2 className="mt-1 text-lg font-semibold">{attribute.name}</h2>
              </div>
              <StatusBadge status={attribute.status} />
            </div>
            <p className="mt-3 text-3xl font-semibold">{attribute.currentValue.toFixed(1)}</p>
            <div className="mt-3">
              <AttributeScale
                currentValue={attribute.currentValue}
                baseValue={attribute.baseValue}
                potentialValue={attribute.potentialValue}
              />
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

export { AttributesPage as default };
