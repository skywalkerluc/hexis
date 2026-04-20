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

function lifecycleContext(recommendation: RecommendationView): string {
  if (recommendation.status === "ACTIVE") {
    return "Ready when you are.";
  }
  if (recommendation.status === "DISMISSED") {
    return "Dismissed for now. It can return if this area slips again.";
  }
  if (recommendation.status === "APPLIED") {
    return "Applied recently. We will recheck before suggesting it again.";
  }
  return "Expired. It only returns if renewed risk appears.";
}

export function RecommendationItem({
  recommendation,
  allowActions,
  actionSource,
}: {
  recommendation: RecommendationView;
  allowActions: boolean;
  actionSource?: "default" | "return_session";
}) {
  return (
    <li className="rounded-md border border-[var(--color-hairline)] bg-[var(--color-background)] p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{recommendation.title}</p>
        <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
          {lifecycleLabel(recommendation)}
        </span>
      </div>
      <p className="mt-1 text-xs text-[var(--color-muted)]">{lifecycleContext(recommendation)}</p>
      <p className="mt-2 text-xs text-[var(--color-gold)]">
        {recommendation.attributeName} · +{recommendation.expectedCurrentGain.toFixed(2)} expected current
      </p>
      <p className="mt-2 text-[11px] uppercase tracking-wide text-[var(--color-muted)]">Why now</p>
      <p className="mt-1 text-sm leading-relaxed text-[var(--color-foreground)]">{recommendation.rationale}</p>

      {allowActions && recommendation.status === "ACTIVE" ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <form action={applyRecommendationAction}>
            <input type="hidden" name="recommendationId" value={recommendation.id} />
            <input type="hidden" name="source" value={actionSource ?? "default"} />
            <button className="min-h-11 w-full rounded-md border border-[var(--color-teal)] px-3 py-2 text-sm font-medium text-[var(--color-teal)] hover:bg-[var(--color-surface-raised)]">
              Mark applied
            </button>
          </form>
          <form action={dismissRecommendationAction}>
            <input type="hidden" name="recommendationId" value={recommendation.id} />
            <input type="hidden" name="source" value={actionSource ?? "default"} />
            <button className="min-h-11 w-full rounded-md border px-3 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
              Dismiss
            </button>
          </form>
        </div>
      ) : null}
    </li>
  );
}
