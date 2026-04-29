"use client";

import { useEffect, useRef } from "react";

type XpBarProps = {
  level: number;
  currentXp: number;
  maxXp: number;
  animate?: boolean;
};

export function XpBar({ level, currentXp, maxXp, animate = true }: XpBarProps) {
  const fillRef = useRef<HTMLDivElement>(null);
  const percentage = Math.min(100, (currentXp / maxXp) * 100);

  useEffect(() => {
    if (!animate || !fillRef.current) return;
    fillRef.current.style.width = "0%";
    const timer = setTimeout(() => {
      if (fillRef.current) {
        fillRef.current.style.transition = "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
        fillRef.current.style.width = `${percentage}%`;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage, animate]);

  return (
    <div className="flex items-center gap-3">
      <span
        className="shrink-0 text-xs uppercase tracking-widest font-medium"
        style={{ color: "var(--color-gold)" }}
      >
        Nível {level}
      </span>
      <div
        className="relative h-1.5 flex-1 overflow-hidden rounded-full"
        style={{ background: "var(--color-surface-raised)" }}
      >
        <div
          ref={fillRef}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: animate ? "0%" : `${percentage}%`,
            background: "linear-gradient(90deg, var(--color-teal), var(--color-gold))",
            boxShadow: "0 0 8px 1px oklch(0.78 0.09 85 / 0.5)",
          }}
        />
      </div>
      <span className="shrink-0 text-xs" style={{ color: "var(--color-muted)" }}>
        {currentXp}/{maxXp} XP
      </span>
    </div>
  );
}
