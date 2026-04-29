import { SCORE_MAX, SCORE_MIN } from "@/shared/kernel/scoring.constants";

export type AttributeDefinitionSeed = {
  slug: string;
  name: string;
  shortCode: string;
  description: string;
  category: string;
  defaultCurrentValue: number;
  defaultBaseValue: number;
  defaultPotentialValue: number;
  scaleMin: number;
  scaleMax: number;
};

export const ATTRIBUTE_DEFINITION_SEEDS: readonly AttributeDefinitionSeed[] = [
  {
    slug: "focus",
    name: "Concentração",
    shortCode: "CON",
    description: "Atenção voluntária sustentada em uma tarefa escolhida.",
    category: "cognitive",
    defaultCurrentValue: 10.4,
    defaultBaseValue: 10,
    defaultPotentialValue: 15.8,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
  {
    slug: "discipline",
    name: "Disciplina",
    shortCode: "DIS",
    description: "Confiabilidade em honrar ações pré-comprometidas.",
    category: "executive",
    defaultCurrentValue: 10.2,
    defaultBaseValue: 9.8,
    defaultPotentialValue: 15.6,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
  {
    slug: "energy",
    name: "Energia",
    shortCode: "ENR",
    description: "Capacidade disponível para trabalho com esforço e recuperação.",
    category: "somatic",
    defaultCurrentValue: 10,
    defaultBaseValue: 10,
    defaultPotentialValue: 16,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
  {
    slug: "organization",
    name: "Organização",
    shortCode: "ORG",
    description: "Capacidade de estruturar ambiente e tempo para execução.",
    category: "executive",
    defaultCurrentValue: 10.3,
    defaultBaseValue: 10,
    defaultPotentialValue: 16.2,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
  {
    slug: "resilience",
    name: "Resiliência",
    shortCode: "RES",
    description: "Funcionalidade sob estresse e recuperação de adversidades.",
    category: "psychological",
    defaultCurrentValue: 10.1,
    defaultBaseValue: 9.9,
    defaultPotentialValue: 15.5,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
  {
    slug: "memory",
    name: "Memória",
    shortCode: "MEM",
    description: "Qualidade de codificação, retenção e recuperação de informações.",
    category: "cognitive",
    defaultCurrentValue: 10.1,
    defaultBaseValue: 9.9,
    defaultPotentialValue: 15.4,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
  {
    slug: "creativity",
    name: "Criatividade",
    shortCode: "CRI",
    description: "Geração de ideias originais e qualidade de recombinação.",
    category: "cognitive",
    defaultCurrentValue: 10.4,
    defaultBaseValue: 10,
    defaultPotentialValue: 16.3,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
  {
    slug: "leadership",
    name: "Liderança",
    shortCode: "LID",
    description: "Capacidade de criar clareza e coordenar pessoas.",
    category: "relational",
    defaultCurrentValue: 9.8,
    defaultBaseValue: 9.7,
    defaultPotentialValue: 15.8,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
  {
    slug: "emotional-control",
    name: "Equilíbrio Emocional",
    shortCode: "EQU",
    description: "Estabilidade sob ativação emocional e gestão de estresse.",
    category: "psychological",
    defaultCurrentValue: 10.2,
    defaultBaseValue: 10,
    defaultPotentialValue: 15.9,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
  {
    slug: "physical-endurance",
    name: "Resistência Física",
    shortCode: "RFI",
    description: "Capacidade de esforço físico sustentável.",
    category: "somatic",
    defaultCurrentValue: 9.9,
    defaultBaseValue: 9.8,
    defaultPotentialValue: 16.4,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
] as const;
