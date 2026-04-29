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
    return "Recommended now.";
  }
  if (recommendation.status === "DISMISSED") {
    return "Skipped for now.";
  }
  if (recommendation.status === "APPLIED") {
    return "Done recently.";
  }
  return "No longer a priority now.";
}

const RATIONALE_PREVIEW_MAX = 112;

function compactRationale(text: string): string {
  if (text.length <= RATIONALE_PREVIEW_MAX) {
    return text;
  }
  return `${text.slice(0, RATIONALE_PREVIEW_MAX).trimEnd()}...`;
}

function actionTitle(recommendation: RecommendationView): string {
  return `Sustain ${recommendation.attributeName} this week`;
}

function whyNowText(recommendation: RecommendationView): string {
  if (recommendation.status === "APPLIED") {
    return `${recommendation.attributeName} got recent reinforcement. Keep it stable with a light follow-up.`;
  }
  if (recommendation.status === "DISMISSED") {
    return `${recommendation.attributeName} still shows a weak signal and may slip without reinforcement.`;
  }
  if (recommendation.status === "EXPIRED") {
    return `${recommendation.attributeName} is currently more stable. This is kept for context only.`;
  }
  return compactRationale(recommendation.rationale);
}

function nextStepText(recommendation: RecommendationView): string {
  return `Next step: log one short ${recommendation.attributeName.toLowerCase()}-focused block this week.`;
}

function impactText(recommendation: RecommendationView): string {
  return `Expected short-term lift: +${recommendation.expectedCurrentGain.toFixed(2)} in current score.`;
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
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug">{actionTitle(recommendation)}</p>
        </div>
        <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
          {lifecycleLabel(recommendation)}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[var(--color-foreground)]">{whyNowText(recommendation)}</p>
      <p className="mt-1 text-xs text-[var(--color-muted)]">{nextStepText(recommendation)}</p>
      <p className="mt-1 text-[11px] text-[var(--color-gold)]">{impactText(recommendation)}</p>
      <p className="mt-1 text-[11px] text-[var(--color-muted)]">{lifecycleContext(recommendation)}</p>

      {allowActions && recommendation.status === "ACTIVE" ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <form action={applyRecommendationAction}>
            <input type="hidden" name="recommendationId" value={recommendation.id} />
            <input type="hidden" name="source" value={actionSource ?? "default"} />
            <button className="min-h-11 w-full rounded-md bg-[var(--color-teal)] px-3 py-2 text-sm font-medium text-[var(--color-background)]">
              Mark applied
            </button>
          </form>
          <form action={dismissRecommendationAction}>
            <input type="hidden" name="recommendationId" value={recommendation.id} />
            <input type="hidden" name="source" value={actionSource ?? "default"} />
            <button className="hexis-button-secondary w-full px-3 py-2 text-sm">
              Dismiss
            </button>
          </form>
        </div>
      ) : null}
    </li>
  );
}
