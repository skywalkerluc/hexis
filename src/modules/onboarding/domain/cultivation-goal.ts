export const CULTIVATION_GOAL = {
  CONCENTRACAO: "CONCENTRACAO",
  ENERGIA: "ENERGIA",
  DISCIPLINA: "DISCIPLINA",
  FORCA: "FORCA",
  CRIATIVIDADE: "CRIATIVIDADE",
  EQUILIBRIO: "EQUILIBRIO",
  APRENDIZADO: "APRENDIZADO",
  COMUNICACAO: "COMUNICACAO",
  FINANCAS: "FINANCAS",
  CORAGEM: "CORAGEM",
} as const;

export type CultivationGoal =
  (typeof CULTIVATION_GOAL)[keyof typeof CULTIVATION_GOAL];

export type CultivationGoalOption = {
  value: CultivationGoal;
  label: string;
  emoji: string;
  description: string;
  focusAttributeSlugs: readonly string[];
  suggestedEventType: "TRAINING" | "PRACTICE" | "ROUTINE" | "ACHIEVEMENT" | "RECOVERY";
};

export const CULTIVATION_GOAL_OPTIONS: readonly CultivationGoalOption[] = [
  {
    value: CULTIVATION_GOAL.CONCENTRACAO,
    label: "Concentração",
    emoji: "🧠",
    description: "Foco profundo, resistência à distração.",
    focusAttributeSlugs: ["focus", "memory", "discipline"],
    suggestedEventType: "PRACTICE",
  },
  {
    value: CULTIVATION_GOAL.ENERGIA,
    label: "Energia",
    emoji: "⚡",
    description: "Disposição física e mental no dia a dia.",
    focusAttributeSlugs: ["energy", "physical-endurance", "resilience"],
    suggestedEventType: "RECOVERY",
  },
  {
    value: CULTIVATION_GOAL.DISCIPLINA,
    label: "Disciplina",
    emoji: "🔥",
    description: "Consistência mesmo sem motivação.",
    focusAttributeSlugs: ["discipline", "organization", "focus"],
    suggestedEventType: "ROUTINE",
  },
  {
    value: CULTIVATION_GOAL.FORCA,
    label: "Força",
    emoji: "💪",
    description: "Capacidade física e saúde.",
    focusAttributeSlugs: ["physical-endurance", "energy", "resilience"],
    suggestedEventType: "TRAINING",
  },
  {
    value: CULTIVATION_GOAL.CRIATIVIDADE,
    label: "Criatividade",
    emoji: "🎨",
    description: "Pensamento original, expressão e solução de problemas.",
    focusAttributeSlugs: ["creativity", "focus", "memory"],
    suggestedEventType: "PRACTICE",
  },
  {
    value: CULTIVATION_GOAL.EQUILIBRIO,
    label: "Equilíbrio",
    emoji: "😌",
    description: "Gestão de estresse e bem-estar emocional.",
    focusAttributeSlugs: ["emotional-control", "resilience", "energy"],
    suggestedEventType: "RECOVERY",
  },
  {
    value: CULTIVATION_GOAL.APRENDIZADO,
    label: "Aprendizado",
    emoji: "📚",
    description: "Aquisição de conhecimento e habilidades novas.",
    focusAttributeSlugs: ["memory", "focus", "creativity"],
    suggestedEventType: "PRACTICE",
  },
  {
    value: CULTIVATION_GOAL.COMUNICACAO,
    label: "Comunicação",
    emoji: "🗣️",
    description: "Expressão, escuta e relações interpessoais.",
    focusAttributeSlugs: ["leadership", "emotional-control"],
    suggestedEventType: "PRACTICE",
  },
  {
    value: CULTIVATION_GOAL.FINANCAS,
    label: "Finanças",
    emoji: "💰",
    description: "Gestão financeira, poupança e consciência econômica.",
    focusAttributeSlugs: ["discipline", "organization"],
    suggestedEventType: "ROUTINE",
  },
  {
    value: CULTIVATION_GOAL.CORAGEM,
    label: "Coragem",
    emoji: "⚔️",
    description: "Tomar iniciativa, superar o medo, sair da zona de conforto.",
    focusAttributeSlugs: ["resilience", "emotional-control", "leadership"],
    suggestedEventType: "ACHIEVEMENT",
  },
] as const;

export type CultivationGoalView = {
  value: CultivationGoal;
  label: string;
  emoji: string;
  description: string;
  focusAttributeSlugs: readonly string[];
  suggestedEventType: CultivationGoalOption["suggestedEventType"];
};

export function readCultivationGoal(goal: CultivationGoal): CultivationGoalView {
  const option = CULTIVATION_GOAL_OPTIONS.find((item) => item.value === goal);
  if (!option) {
    throw new Error(`Objetivo desconhecido: ${goal}`);
  }
  return {
    value: option.value,
    label: option.label,
    emoji: option.emoji,
    description: option.description,
    focusAttributeSlugs: option.focusAttributeSlugs,
    suggestedEventType: option.suggestedEventType,
  };
}
