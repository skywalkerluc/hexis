export const CULTIVATION_GOAL = {
  FOCUS: "FOCUS",
  DISCIPLINE: "DISCIPLINE",
  ENERGY: "ENERGY",
  ORGANIZATION: "ORGANIZATION",
  CONSISTENCY: "CONSISTENCY",
} as const;

export type CultivationGoal =
  (typeof CULTIVATION_GOAL)[keyof typeof CULTIVATION_GOAL];

export type CultivationGoalOption = {
  value: CultivationGoal;
  label: string;
  description: string;
  focusAttributeSlugs: readonly string[];
  suggestedEventType: "TRAINING" | "PRACTICE" | "ROUTINE" | "ACHIEVEMENT" | "RECOVERY";
};

export const CULTIVATION_GOAL_OPTIONS: readonly CultivationGoalOption[] = [
  {
    value: CULTIVATION_GOAL.FOCUS,
    label: "Focus",
    description: "Sustain deeper attention with less context switching.",
    focusAttributeSlugs: ["focus", "discipline", "memory"],
    suggestedEventType: "PRACTICE",
  },
  {
    value: CULTIVATION_GOAL.DISCIPLINE,
    label: "Discipline",
    description: "Improve execution reliability through repeatable blocks.",
    focusAttributeSlugs: ["discipline", "organization", "focus"],
    suggestedEventType: "ROUTINE",
  },
  {
    value: CULTIVATION_GOAL.ENERGY,
    label: "Energy",
    description: "Protect sustainable output by balancing effort and recovery.",
    focusAttributeSlugs: ["energy", "physical-endurance", "resilience"],
    suggestedEventType: "RECOVERY",
  },
  {
    value: CULTIVATION_GOAL.ORGANIZATION,
    label: "Organization",
    description: "Create structure that reduces friction and missed follow-through.",
    focusAttributeSlugs: ["organization", "discipline", "focus"],
    suggestedEventType: "ROUTINE",
  },
  {
    value: CULTIVATION_GOAL.CONSISTENCY,
    label: "Consistency",
    description: "Maintain steady cultivation even when motivation fluctuates.",
    focusAttributeSlugs: ["discipline", "resilience", "organization"],
    suggestedEventType: "TRAINING",
  },
] as const;

export type CultivationGoalView = {
  value: CultivationGoal;
  label: string;
  description: string;
  focusAttributeSlugs: readonly string[];
  suggestedEventType: CultivationGoalOption["suggestedEventType"];
};

export function readCultivationGoal(goal: CultivationGoal): CultivationGoalView {
  const option = CULTIVATION_GOAL_OPTIONS.find((item) => item.value === goal);
  if (!option) {
    throw new Error(`Unknown cultivation goal: ${goal}`);
  }

  return {
    value: option.value,
    label: option.label,
    description: option.description,
    focusAttributeSlugs: option.focusAttributeSlugs,
    suggestedEventType: option.suggestedEventType,
  };
}
