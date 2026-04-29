"use client";

import { useEffect, useState } from "react";

type AttributeEntry = {
  name: string;
  emoji: string;
  level: number;
};

type CharacterSheetRevealProps = {
  attributes: AttributeEntry[];
};

export function CharacterSheetReveal({ attributes }: CharacterSheetRevealProps) {
  const [visible, setVisible] = useState<number>(0);

  useEffect(() => {
    if (visible >= attributes.length) return;
    const timer = setTimeout(() => setVisible((v) => v + 1), 220);
    return () => clearTimeout(timer);
  }, [visible, attributes.length]);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {attributes.map((attr, index) => (
        <div
          key={attr.name}
          className="rounded-lg border p-4"
          style={{
            borderColor: "var(--color-hairline)",
            background: "var(--color-background)",
            opacity: index < visible ? 1 : 0,
            transform: index < visible ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.35s ease-out, transform 0.35s ease-out",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{attr.emoji}</span>
            <p className="text-sm font-semibold">{attr.name}</p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full"
              style={{ background: "var(--color-surface-raised)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: index < visible ? `${(attr.level / 20) * 100}%` : "0%",
                  background:
                    "linear-gradient(90deg, var(--color-teal), var(--color-gold))",
                  boxShadow: "0 0 6px 1px oklch(0.78 0.09 85 / 0.4)",
                }}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: "var(--color-gold)" }}>
              Nv. 1
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
