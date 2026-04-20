import { applyRecommendationAction, dismissRecommendationAction } from "@/modules/recommendations/presentation/recommendation.actions";
import type { RecommendationView } from "@/modules/recommendations/application/read-recommendations.query";

function lifecycleLabel(recommendation: RecommendationView): string {
  if (recommendation.status === "APPLIED") {
    return "Applied";
  }
  if (recommendation.status === "DISMISSED") {
    return "Dismissed";
  }
  if (recommendation.status === "EXPIRED") {
    return "Expired";
  }
  return "Active";
}

export function RecommendationItem({
  recommendation,
  allowActions,
}: {
  recommendation: RecommendationView;
  allowActions: boolean;
}) {
  return (
    <li className="rounded-md border border-[var(--color-hairline)] bg-[var(--color-background)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{recommendation.title}</p>
        <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
          {lifecycleLabel(recommendation)}
        </span>
      </div>
      <p className="mt-1 text-xs text-[var(--color-muted)]">{recommendation.rationale}</p>
      <p className="mt-2 text-xs text-[var(--color-gold)]">
        {recommendation.attributeName} · Expected +{recommendation.expectedCurrentGain.toFixed(2)} current
      </p>

      {allowActions && recommendation.status === "ACTIVE" ? (
        <div className="mt-3 flex items-center gap-2">
          <form action={applyRecommendationAction}>
            <input type="hidden" name="recommendationId" value={recommendation.id} />
            <button className="rounded-md border border-[var(--color-teal)] px-2.5 py-1 text-xs text-[var(--color-teal)] hover:bg-[var(--color-surface-raised)]">
              Mark applied
            </button>
          </form>
          <form action={dismissRecommendationAction}>
            <input type="hidden" name="recommendationId" value={recommendation.id} />
            <button className="rounded-md border px-2.5 py-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
              Dismiss
            </button>
          </form>
        </div>
      ) : null}
    </li>
  );
}
