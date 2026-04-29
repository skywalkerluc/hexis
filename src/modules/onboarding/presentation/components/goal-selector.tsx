"use client";

import { useState } from "react";
import type { CultivationGoalOption } from "@/modules/onboarding/domain/cultivation-goal";

const MAX_SELECTIONS = 4;

type GoalSelectorProps = {
  goals: readonly CultivationGoalOption[];
};

export function GoalSelector({ goals }: GoalSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(value: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else if (next.size < MAX_SELECTIONS) {
        next.add(value);
      }
      return next;
    });
  }

  return (
    <div>
      <p className="mb-4 text-xs" style={{ color: "var(--color-muted)" }}>
        Escolha até {MAX_SELECTIONS}.{" "}
        {selected.size > 0
          ? `${selected.size} selecionado${selected.size > 1 ? "s" : ""}.`
          : ""}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const isSelected = selected.has(goal.value);
          const isDisabled = !isSelected && selected.size >= MAX_SELECTIONS;
          return (
            <label
              key={goal.value}
              className="block rounded-lg border p-4 transition-colors"
              style={{
                borderColor: isSelected ? "var(--color-gold)" : "var(--color-hairline)",
                background: isSelected
                  ? "color-mix(in oklab, var(--color-gold) 8%, var(--color-surface))"
                  : "var(--color-surface)",
                opacity: isDisabled ? 0.45 : 1,
                cursor: isDisabled ? "not-allowed" : "pointer",
              }}
            >
              <input
                type="checkbox"
                name="cultivationGoal"
                value={goal.value}
                checked={isSelected}
                onChange={() => toggle(goal.value)}
                disabled={isDisabled}
                className="sr-only"
              />
              <span className="text-2xl">{goal.emoji}</span>
              <p className="mt-2 text-sm font-semibold">{goal.label}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                {goal.description}
              </p>
            </label>
          );
        })}
      </div>
    </div>
  );
}
