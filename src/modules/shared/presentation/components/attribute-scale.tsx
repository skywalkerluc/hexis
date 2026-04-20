import { SCORE_MAX, SCORE_MIN } from "@/shared/kernel/scoring.constants";

export type AttributeScaleProps = {
  currentValue: number;
  baseValue: number;
  potentialValue: number;
};

export function AttributeScale({
  currentValue,
  baseValue,
  potentialValue,
}: AttributeScaleProps) {
  const min = SCORE_MIN;
  const max = SCORE_MAX;
  const range = max - min;

  const currentPercentage = ((currentValue - min) / range) * 100;
  const basePercentage = ((baseValue - min) / range) * 100;
  const potentialPercentage = ((potentialValue - min) / range) * 100;

  const fillStart = Math.min(currentPercentage, basePercentage);
  const fillWidth = Math.abs(currentPercentage - basePercentage);

  return (
    <div className="w-full">
      <div className="relative h-1.5 w-full rounded-full bg-[var(--color-surface-raised)]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white/10"
          style={{ width: `${potentialPercentage}%` }}
        />
        <div
          className="absolute inset-y-0 rounded-full"
          style={{
            left: `${fillStart}%`,
            width: `${fillWidth}%`,
            background:
              "linear-gradient(90deg, color-mix(in oklab, var(--color-teal) 80%, transparent), var(--color-gold))",
          }}
        />
        <div
          className="absolute -top-1 h-3.5 w-px bg-white/55"
          style={{ left: `${basePercentage}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-[var(--color-muted)]">
        <span>{SCORE_MIN}</span>
        <span>{SCORE_MAX / 4}</span>
        <span>{SCORE_MAX / 2}</span>
        <span>{(SCORE_MAX * 3) / 4}</span>
        <span>{SCORE_MAX}</span>
      </div>
    </div>
  );
}
