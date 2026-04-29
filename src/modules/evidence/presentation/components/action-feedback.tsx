"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Impact = {
  attributeName: string;
  deltaCurrent: number;
};

type ActionFeedbackProps = {
  intensity: "LIGHT" | "MODERATE" | "INTENSE";
  impacts: Impact[];
  onDismiss: () => void;
};

const INTENSITY_CONFIG = {
  LIGHT: {
    headline: "Ação registrada.",
    sub: "Seus atributos foram atualizados.",
    glowColor: "var(--color-teal)",
    showFlash: false,
    showParticles: false,
    particleCount: 0,
  },
  MODERATE: {
    headline: "Bom progresso.",
    sub: "Atributos em movimento.",
    glowColor: "var(--color-gold)",
    showFlash: false,
    showParticles: true,
    particleCount: 3,
  },
  INTENSE: {
    headline: "Ação de alto impacto.",
    sub: "Seus atributos subiram significativamente.",
    glowColor: "var(--color-gold)",
    showFlash: true,
    showParticles: true,
    particleCount: 5,
  },
} as const;

export function ActionFeedback({ intensity, impacts, onDismiss }: ActionFeedbackProps) {
  const config = INTENSITY_CONFIG[intensity];
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-lg border p-5"
      style={{ borderColor: config.glowColor, background: "var(--color-surface)" }}
    >
      {config.showFlash && (
        <div
          className="pointer-events-none absolute inset-0 rounded-lg"
          style={{
            background: "var(--color-gold)",
            animation: "screen-flash 0.6s ease-out forwards",
          }}
        />
      )}

      <div
        className="animate-slide-in-up"
        style={{ opacity: showContent ? 1 : 0, transition: "opacity 0.2s" }}
      >
        <p className="text-lg font-semibold" style={{ color: config.glowColor }}>
          {config.headline}
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
          {config.sub}
        </p>

        {config.showParticles && (
          <div className="my-3 flex gap-1">
            {Array.from({ length: config.particleCount }).map((_, i) => (
              <span
                key={i}
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  background: config.glowColor,
                  animation: `particle-float ${0.6 + i * 0.1}s ease-out ${i * 0.08}s forwards`,
                }}
              />
            ))}
          </div>
        )}

        {impacts.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {impacts.slice(0, 3).map((impact) => (
              <li key={impact.attributeName} className="flex items-center gap-2 text-sm">
                <span
                  className="text-xs font-semibold"
                  style={{
                    color:
                      impact.deltaCurrent >= 0
                        ? "var(--color-positive)"
                        : "var(--color-critical)",
                  }}
                >
                  {impact.deltaCurrent >= 0 ? "+" : ""}
                  {impact.deltaCurrent.toFixed(2)}
                </span>
                <span style={{ color: "var(--color-muted)" }}>{impact.attributeName}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard"
            className="rounded-md px-4 py-2 text-xs font-semibold"
            style={{ background: "var(--color-gold)", color: "var(--color-gold-foreground)" }}
          >
            Ir ao painel
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className="hexis-button-secondary px-4 py-2 text-xs"
          >
            Registrar outra
          </button>
        </div>
      </div>
    </div>
  );
}
