const STATUS_STYLE = {
  IMPROVING: {
    label: "Em Alta",
    textColor: "var(--color-positive)",
    backgroundColor: "color-mix(in oklab, var(--color-positive) 18%, transparent)",
    borderColor: "color-mix(in oklab, var(--color-positive) 38%, transparent)",
  },
  STABLE: {
    label: "Estável",
    textColor: "var(--color-muted)",
    backgroundColor: "color-mix(in oklab, var(--color-surface-raised) 80%, transparent)",
    borderColor: "var(--color-hairline)",
  },
  DECAYING: {
    label: "Em Declínio",
    textColor: "var(--color-warning)",
    backgroundColor: "color-mix(in oklab, var(--color-warning) 16%, transparent)",
    borderColor: "color-mix(in oklab, var(--color-warning) 38%, transparent)",
  },
  AT_RISK: {
    label: "Em Risco",
    textColor: "var(--color-critical)",
    backgroundColor: "color-mix(in oklab, var(--color-critical) 16%, transparent)",
    borderColor: "color-mix(in oklab, var(--color-critical) 38%, transparent)",
  },
} as const;

function resolveStyle(status: string) {
  if (status in STATUS_STYLE) {
    const key = status as keyof typeof STATUS_STYLE;
    return STATUS_STYLE[key];
  }
  return STATUS_STYLE.STABLE;
}

export function StatusBadge({ status }: { status: string }) {
  const style = resolveStyle(status);

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide"
      style={{
        color: style.textColor,
        borderColor: style.borderColor,
        backgroundColor: style.backgroundColor,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: style.textColor }}
      />
      {style.label}
    </span>
  );
}
