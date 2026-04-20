export type AvatarOptionSeed = {
  code: string;
  label: string;
  background: string;
  ring: string;
  mark: string;
  sortOrder: number;
};

export const AVATAR_OPTION_SEEDS: readonly AvatarOptionSeed[] = [
  {
    code: "obsidian-1",
    label: "Obsidian Gold",
    background: "var(--color-surface-raised)",
    ring: "var(--color-gold)",
    mark: "var(--color-gold)",
    sortOrder: 1,
  },
  {
    code: "obsidian-2",
    label: "Obsidian Teal",
    background: "var(--color-surface-raised)",
    ring: "var(--color-teal)",
    mark: "var(--color-teal)",
    sortOrder: 2,
  },
  {
    code: "obsidian-3",
    label: "Obsidian Stone",
    background: "var(--color-surface-raised)",
    ring: "oklch(0.86 0.012 85)",
    mark: "var(--color-gold)",
    sortOrder: 3,
  },
  {
    code: "obsidian-4",
    label: "Obsidian Positive",
    background: "var(--color-surface-raised)",
    ring: "var(--color-positive)",
    mark: "var(--color-positive)",
    sortOrder: 4,
  },
  {
    code: "obsidian-5",
    label: "Obsidian Warning",
    background: "var(--color-surface-raised)",
    ring: "var(--color-warning)",
    mark: "var(--color-warning)",
    sortOrder: 5,
  },
] as const;
