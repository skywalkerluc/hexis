export type OnboardingTemplateSeed = {
  key: string;
  label: string;
  description: string;
  isDefault: boolean;
  attributes: readonly {
    slug: string;
    emphasisWeight: number;
  }[];
};

export const ONBOARDING_TEMPLATE_SEEDS: readonly OnboardingTemplateSeed[] = [
  {
    key: "recommended",
    label: "Recommended",
    description: "Balanced cognitive, relational and somatic attributes.",
    isDefault: true,
    attributes: [
      { slug: "focus", emphasisWeight: 1 },
      { slug: "discipline", emphasisWeight: 1 },
      { slug: "energy", emphasisWeight: 1 },
      { slug: "organization", emphasisWeight: 1 },
      { slug: "resilience", emphasisWeight: 1 },
      { slug: "memory", emphasisWeight: 1 },
      { slug: "creativity", emphasisWeight: 1 },
      { slug: "leadership", emphasisWeight: 1 },
      { slug: "emotional-control", emphasisWeight: 1 },
      { slug: "physical-endurance", emphasisWeight: 1 },
    ],
  },
  {
    key: "deep-work",
    label: "Deep Work",
    description: "Emphasis on sustained cognition and execution consistency.",
    isDefault: false,
    attributes: [
      { slug: "focus", emphasisWeight: 1.45 },
      { slug: "discipline", emphasisWeight: 1.35 },
      { slug: "memory", emphasisWeight: 1.3 },
      { slug: "creativity", emphasisWeight: 1.2 },
      { slug: "organization", emphasisWeight: 1.2 },
      { slug: "energy", emphasisWeight: 1.15 },
    ],
  },
  {
    key: "embodied-practice",
    label: "Embodied Practice",
    description: "Body-first with resilience and emotional stability support.",
    isDefault: false,
    attributes: [
      { slug: "physical-endurance", emphasisWeight: 1.45 },
      { slug: "energy", emphasisWeight: 1.35 },
      { slug: "discipline", emphasisWeight: 1.2 },
      { slug: "resilience", emphasisWeight: 1.25 },
      { slug: "emotional-control", emphasisWeight: 1.2 },
    ],
  },
] as const;
