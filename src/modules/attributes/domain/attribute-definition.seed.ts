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
    name: "Focus",
    shortCode: "FOC",
    description: "Sustained voluntary attention on a chosen task.",
    category: "cognitive",
    defaultCurrentValue: 10.4,
    defaultBaseValue: 10,
    defaultPotentialValue: 15.8,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
  {
    slug: "discipline",
    name: "Discipline",
    shortCode: "DIS",
    description: "Reliability in honoring pre-committed actions.",
    category: "executive",
    defaultCurrentValue: 10.2,
    defaultBaseValue: 9.8,
    defaultPotentialValue: 15.6,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
  {
    slug: "energy",
    name: "Energy",
    shortCode: "ENR",
    description: "Available capacity for effortful work and recovery.",
    category: "somatic",
    defaultCurrentValue: 10,
    defaultBaseValue: 10,
    defaultPotentialValue: 16,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
  {
    slug: "organization",
    name: "Organization",
    shortCode: "ORG",
    description: "Ability to shape environment and time for execution.",
    category: "executive",
    defaultCurrentValue: 10.3,
    defaultBaseValue: 10,
    defaultPotentialValue: 16.2,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
  {
    slug: "resilience",
    name: "Resilience",
    shortCode: "RES",
    description: "Functionality under stress and setback recovery.",
    category: "psychological",
    defaultCurrentValue: 10.1,
    defaultBaseValue: 9.9,
    defaultPotentialValue: 15.5,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
  {
    slug: "memory",
    name: "Memory",
    shortCode: "MEM",
    description: "Encoding, retention and recall quality.",
    category: "cognitive",
    defaultCurrentValue: 10.1,
    defaultBaseValue: 9.9,
    defaultPotentialValue: 15.4,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
  {
    slug: "creativity",
    name: "Creativity",
    shortCode: "CRE",
    description: "Novel idea generation and recombination quality.",
    category: "cognitive",
    defaultCurrentValue: 10.4,
    defaultBaseValue: 10,
    defaultPotentialValue: 16.3,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
  {
    slug: "leadership",
    name: "Leadership",
    shortCode: "LEA",
    description: "Ability to create clarity and coordinate people.",
    category: "relational",
    defaultCurrentValue: 9.8,
    defaultBaseValue: 9.7,
    defaultPotentialValue: 15.8,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
  {
    slug: "emotional-control",
    name: "Emotional Control",
    shortCode: "EMO",
    description: "Stability under emotional activation.",
    category: "psychological",
    defaultCurrentValue: 10.2,
    defaultBaseValue: 10,
    defaultPotentialValue: 15.9,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
  {
    slug: "physical-endurance",
    name: "Physical Endurance",
    shortCode: "PHY",
    description: "Sustainable physical effort capacity.",
    category: "somatic",
    defaultCurrentValue: 9.9,
    defaultBaseValue: 9.8,
    defaultPotentialValue: 16.4,
    scaleMin: SCORE_MIN,
    scaleMax: SCORE_MAX,
  },
] as const;
