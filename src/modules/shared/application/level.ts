// Mapeia composite score (0–20) para nível 1–50.
// Nível = floor(composite * 2.5) + 1, mínimo 1, máximo 50.
export function computeLevel(compositeScore: number): {
  level: number;
  currentXp: number;
  maxXp: number;
} {
  const clamped = Math.max(0, Math.min(20, compositeScore));
  const raw = clamped * 2.5;
  const level = Math.max(1, Math.min(50, Math.floor(raw) + 1));
  const levelProgress = raw - Math.floor(raw);
  const currentXp = Math.round(levelProgress * 100);
  return { level, currentXp, maxXp: 100 };
}
