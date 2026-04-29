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
    label: "Foco Profundo",
    description: "Sustente blocos mais longos de concentração com menos distrações.",
    defaultGoal: CULTIVATION_GOAL.CONCENTRACAO,
    focusAttributeSlugs: ["focus", "memory", "discipline"],
    recommendationBonus: 0.45,
    weeklyPrompt: "Proteja dois blocos de foco profundo sem interrupções.",
  },
  {
    key: LOOP_TEMPLATE_KEY.REBUILD_DISCIPLINE,
    label: "Reconstruir Disciplina",
    description: "Restabeleça confiabilidade de execução após inconsistência.",
    defaultGoal: CULTIVATION_GOAL.DISCIPLINA,
    focusAttributeSlugs: ["discipline", "organization", "resilience"],
    recommendationBonus: 0.45,
    weeklyPrompt: "Reforce uma janela de execução repetível por dia.",
  },
  {
    key: LOOP_TEMPLATE_KEY.RESTORE_ENERGY,
    label: "Restaurar Energia",
    description: "Estabilize esforço e recuperação para evitar depleção oculta.",
    defaultGoal: CULTIVATION_GOAL.ENERGIA,
    focusAttributeSlugs: ["energy", "resilience", "physical-endurance"],
    recommendationBonus: 0.45,
    weeklyPrompt: "Use blocos de recuperação para proteger energia antes do declínio.",
  },
  {
    key: LOOP_TEMPLATE_KEY.GET_ORGANIZED,
    label: "Organizar-se",
    description: "Reduza atrito com planejamento mais preciso e follow-through.",
    defaultGoal: CULTIVATION_GOAL.DISCIPLINA,
    focusAttributeSlugs: ["organization", "discipline", "focus"],
    recommendationBonus: 0.45,
    weeklyPrompt: "Execute um checkpoint de planejamento antes dos blocos principais.",
  },
  {
    key: LOOP_TEMPLATE_KEY.BUILD_CONSISTENCY,
    label: "Construir Consistência",
    description: "Mantenha reforço confiável mesmo em semanas instáveis.",
    defaultGoal: CULTIVATION_GOAL.CORAGEM,
    focusAttributeSlugs: ["discipline", "organization", "resilience"],
    recommendationBonus: 0.45,
    weeklyPrompt: "Registre um bloco de reforço significativo em ritmo constante.",
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
