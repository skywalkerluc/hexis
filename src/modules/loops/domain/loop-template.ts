import type { CultivationGoal } from "@/modules/onboarding/domain/cultivation-goal";
import { CULTIVATION_GOAL } from "@/modules/onboarding/domain/cultivation-goal";

export const LOOP_TEMPLATE_KEY = {
  DEEP_FOCUS: "deep-focus",
  REBUILD_DISCIPLINE: "rebuild-discipline",
  RESTORE_ENERGY: "restore-energy",
  GET_ORGANIZED: "get-organized",
  BUILD_CONSISTENCY: "build-consistency",
} as const;

export type LoopTemplateKey =
  (typeof LOOP_TEMPLATE_KEY)[keyof typeof LOOP_TEMPLATE_KEY];

export type LoopTemplate = {
  key: LoopTemplateKey;
  label: string;
  description: string;
  defaultGoal: CultivationGoal;
  focusAttributeSlugs: readonly string[];
  recommendationBonus: number;
  weeklyPrompt: string;
};

export const LOOP_TEMPLATES: readonly LoopTemplate[] = [
  {
    key: LOOP_TEMPLATE_KEY.DEEP_FOCUS,
    label: "Deep Focus",
    description: "Sustain longer concentration blocks with minimal switching.",
    defaultGoal: CULTIVATION_GOAL.FOCUS,
    focusAttributeSlugs: ["focus", "memory", "discipline"],
    recommendationBonus: 0.45,
    weeklyPrompt: "Protect two uninterrupted deep-focus blocks.",
  },
  {
    key: LOOP_TEMPLATE_KEY.REBUILD_DISCIPLINE,
    label: "Rebuild Discipline",
    description: "Re-establish execution reliability after inconsistency.",
    defaultGoal: CULTIVATION_GOAL.DISCIPLINE,
    focusAttributeSlugs: ["discipline", "organization", "resilience"],
    recommendationBonus: 0.45,
    weeklyPrompt: "Reinforce one repeatable execution window each day.",
  },
  {
    key: LOOP_TEMPLATE_KEY.RESTORE_ENERGY,
    label: "Restore Energy",
    description: "Stabilize effort and recovery to avoid hidden depletion.",
    defaultGoal: CULTIVATION_GOAL.ENERGY,
    focusAttributeSlugs: ["energy", "resilience", "physical-endurance"],
    recommendationBonus: 0.45,
    weeklyPrompt: "Use recovery blocks to protect energy before decline.",
  },
  {
    key: LOOP_TEMPLATE_KEY.GET_ORGANIZED,
    label: "Get Organized",
    description: "Reduce friction through tighter planning and follow-through.",
    defaultGoal: CULTIVATION_GOAL.ORGANIZATION,
    focusAttributeSlugs: ["organization", "discipline", "focus"],
    recommendationBonus: 0.45,
    weeklyPrompt: "Run one short planning checkpoint before key work blocks.",
  },
  {
    key: LOOP_TEMPLATE_KEY.BUILD_CONSISTENCY,
    label: "Build Consistency",
    description: "Maintain reliable reinforcement even in unstable weeks.",
    defaultGoal: CULTIVATION_GOAL.CONSISTENCY,
    focusAttributeSlugs: ["discipline", "organization", "resilience"],
    recommendationBonus: 0.45,
    weeklyPrompt: "Log one meaningful reinforcement block at steady cadence.",
  },
] as const;

const DEFAULT_LOOP_TEMPLATE: LoopTemplate = LOOP_TEMPLATES[0] ?? (() => {
  throw new Error("Loop template seeds are empty.");
})();

export function readLoopTemplateByKey(key: string): LoopTemplate {
  const template = LOOP_TEMPLATES.find((item) => item.key === key);
  if (!template) {
    throw new Error(`Unknown loop template: ${key}`);
  }
  return template;
}

export function defaultLoopTemplateForGoal(goal: CultivationGoal): LoopTemplate {
  const template = LOOP_TEMPLATES.find((item) => item.defaultGoal === goal);
  if (!template) {
    return DEFAULT_LOOP_TEMPLATE;
  }
  return template;
}

export function readDefaultLoopTemplate(): LoopTemplate {
  return DEFAULT_LOOP_TEMPLATE;
}
