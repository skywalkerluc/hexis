# Hexis RPG Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o Hexis de uma ferramenta técnica em um RPG de vida real — português, estética dark atmosférica, onboarding como criação de personagem, e feedback visual que faz cada ação contar.

**Architecture:** O modelo de atributos e o backend permanecem intactos. As mudanças são: (1) expansão do domínio de cultivation goals de 5 para 10 com labels em PT, (2) tradução de nomes/labels de atributos e status para PT, (3) novos componentes de UI (XpBar, ActionFeedback, GoalSelector, CharacterSheetReveal), (4) redesenho das páginas de onboarding, dashboard e log.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind v4, CSS custom properties (oklch), Vitest para testes de domínio.

---

## Checkpoint A: Fundação de domínio e componentes (Tasks 1–5)
Após este checkpoint o app está em PT, com 10 objetivos no domínio e os novos componentes disponíveis. As páginas ainda usam o layout antigo.

## Checkpoint B: Interfaces redesenhadas (Tasks 6–10)
Após este checkpoint o onboarding, dashboard e log estão completamente redesenhados.

---

### Task 1: Traduzir nomes dos atributos para português

**Files:**
- Modify: `src/modules/attributes/domain/attribute-definition.seed.ts`

- [ ] **Step 1: Atualizar todos os `name` e `description` para PT**

Substitua o objeto `ATTRIBUTE_DEFINITION_SEEDS` por:

```typescript
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
```

- [ ] **Step 2: Verificar que o app compila**

```bash
cd /Users/lucasferreira/git/hexis && npx tsc --noEmit
```

Expected: sem erros de tipo.

- [ ] **Step 3: Commit**

```bash
git add src/modules/attributes/domain/attribute-definition.seed.ts
git commit -m "feat: translate attribute names and descriptions to Portuguese"
```

---

### Task 2: Expandir cultivation goals para 10 objetivos em português

**Files:**
- Modify: `src/modules/onboarding/domain/cultivation-goal.ts`

- [ ] **Step 1: Escrever o teste que falha**

Crie `tests/cultivation-goal.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  CULTIVATION_GOAL_OPTIONS,
  readCultivationGoal,
  CULTIVATION_GOAL,
} from "@/modules/onboarding/domain/cultivation-goal";

describe("cultivation goals", () => {
  it("should have exactly 10 goal options", () => {
    expect(CULTIVATION_GOAL_OPTIONS).toHaveLength(10);
  });

  it("should have all labels in Portuguese", () => {
    const labels = CULTIVATION_GOAL_OPTIONS.map((g) => g.label);
    expect(labels).toContain("Concentração");
    expect(labels).toContain("Energia");
    expect(labels).toContain("Disciplina");
    expect(labels).toContain("Força");
    expect(labels).toContain("Criatividade");
    expect(labels).toContain("Equilíbrio");
    expect(labels).toContain("Aprendizado");
    expect(labels).toContain("Comunicação");
    expect(labels).toContain("Finanças");
    expect(labels).toContain("Coragem");
  });

  it("should return a valid goal view for each goal", () => {
    for (const option of CULTIVATION_GOAL_OPTIONS) {
      const view = readCultivationGoal(option.value);
      expect(view.value).toBe(option.value);
      expect(view.label).toBe(option.label);
      expect(view.focusAttributeSlugs.length).toBeGreaterThan(0);
    }
  });

  it("should throw for unknown goal", () => {
    expect(() => readCultivationGoal("UNKNOWN" as any)).toThrow();
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

```bash
cd /Users/lucasferreira/git/hexis && npx vitest run tests/cultivation-goal.test.ts
```

Expected: FAIL — "should have exactly 10 goal options" (o domínio atual tem 5).

- [ ] **Step 3: Substituir o domínio de cultivation goals**

Substitua o conteúdo de `src/modules/onboarding/domain/cultivation-goal.ts`:

```typescript
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
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

```bash
cd /Users/lucasferreira/git/hexis && npx vitest run tests/cultivation-goal.test.ts
```

Expected: PASS — todos os 4 casos.

- [ ] **Step 5: Verificar que o projeto compila sem erros de tipo**

```bash
cd /Users/lucasferreira/git/hexis && npx tsc --noEmit
```

Expected: sem erros. Se houver erros em arquivos que usam `CULTIVATION_GOAL.FOCUS`, `CULTIVATION_GOAL.DISCIPLINE` etc., atualize as referências para os novos valores (`CONCENTRACAO`, `DISCIPLINA`, etc.).

- [ ] **Step 6: Atualizar o campo `cultivationGoal` no Prisma seed se existir**

Verifique `prisma/seed.ts` por referências aos valores antigos (FOCUS, DISCIPLINE, ENERGY, ORGANIZATION, CONSISTENCY) e atualize para os novos valores.

- [ ] **Step 7: Commit**

```bash
git add src/modules/onboarding/domain/cultivation-goal.ts tests/cultivation-goal.test.ts prisma/seed.ts
git commit -m "feat: expand cultivation goals to 10 objectives in Portuguese"
```

---

### Task 3: Traduzir StatusBadge para português

**Files:**
- Modify: `src/modules/shared/presentation/components/status-badge.tsx`

- [ ] **Step 1: Atualizar os labels para PT**

Substitua o objeto `STATUS_STYLE`:

```typescript
const STATUS_STYLE = {
  IMPROVING: {
    label: "Em Alta",
    textColor: "var(--color-positive)",
    backgroundColor: "color-mix(in oklab, var(--color-positive) 18%, transparent)",
    borderColor: "color-mix(in oklab, var(--color-positive) 38%, transparent)",
  },
  STABLE: {
    label: "Estável",
    textColor: "var(--color-muted)",
    backgroundColor: "color-mix(in oklab, var(--color-surface-raised) 80%, transparent)",
    borderColor: "var(--color-hairline)",
  },
  DECAYING: {
    label: "Em Declínio",
    textColor: "var(--color-warning)",
    backgroundColor: "color-mix(in oklab, var(--color-warning) 16%, transparent)",
    borderColor: "color-mix(in oklab, var(--color-warning) 38%, transparent)",
  },
  AT_RISK: {
    label: "Em Risco",
    textColor: "var(--color-critical)",
    backgroundColor: "color-mix(in oklab, var(--color-critical) 16%, transparent)",
    borderColor: "color-mix(in oklab, var(--color-critical) 38%, transparent)",
  },
} as const;
```

- [ ] **Step 2: Verificar compilação**

```bash
cd /Users/lucasferreira/git/hexis && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/shared/presentation/components/status-badge.tsx
git commit -m "feat: translate status badge labels to Portuguese"
```

---

### Task 4: Adicionar keyframes de animação ao CSS global

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Adicionar keyframes e variáveis de glow ao final do arquivo**

```css
/* Animações RPG */
@keyframes xp-fill {
  from { width: 0%; }
  to { width: var(--xp-target-width); }
}

@keyframes attribute-rise {
  from { transform: scaleX(var(--bar-from-scale)); }
  to { transform: scaleX(1); }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 6px 1px oklch(0.78 0.09 85 / 0.4); }
  50% { box-shadow: 0 0 14px 3px oklch(0.78 0.09 85 / 0.7); }
}

@keyframes particle-float {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-32px) scale(0.5); }
}

@keyframes screen-flash {
  0% { opacity: 0; }
  30% { opacity: 0.15; }
  100% { opacity: 0; }
}

@keyframes slide-in-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-slide-in-up {
  animation: slide-in-up 0.35s ease-out forwards;
}

.animate-glow-pulse {
  animation: glow-pulse 2s ease-in-out infinite;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: add RPG animation keyframes to global CSS"
```

---

### Task 5: Criar componente XpBar

**Files:**
- Create: `src/modules/shared/presentation/components/xp-bar.tsx`

- [ ] **Step 1: Criar o componente**

```typescript
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
    fillRef.current.style.setProperty("--xp-target-width", `${percentage}%`);
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
        className="text-xs uppercase tracking-widest"
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
            background:
              "linear-gradient(90deg, var(--color-teal), var(--color-gold))",
            boxShadow: "0 0 8px 1px oklch(0.78 0.09 85 / 0.5)",
          }}
        />
      </div>
      <span className="text-xs" style={{ color: "var(--color-muted)" }}>
        {currentXp}/{maxXp} XP
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Criar função helper para calcular nível a partir do composite score**

Crie `src/modules/shared/application/level.ts`:

```typescript
// Mapeia composite score (0–20 * nAtributos) para nível 1–50.
// O composite no dashboard é a média dos atributos (0–20).
// Nível = floor(composite * 2.5) + 1, mínimo 1, máximo 50.
export function computeLevel(compositeScore: number): {
  level: number;
  currentXp: number;
  maxXp: number;
} {
  const clamped = Math.max(0, Math.min(20, compositeScore));
  const level = Math.max(1, Math.floor(clamped * 2.5) + 1);
  const levelProgress = clamped * 2.5 - Math.floor(clamped * 2.5);
  const currentXp = Math.round(levelProgress * 100);
  const maxXp = 100;
  return { level, currentXp, maxXp };
}
```

- [ ] **Step 3: Verificar compilação**

```bash
cd /Users/lucasferreira/git/hexis && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/modules/shared/presentation/components/xp-bar.tsx src/modules/shared/application/level.ts
git commit -m "feat: add XpBar component and level computation helper"
```

---

### Task 6: Redesenhar onboarding como criação de personagem

**Files:**
- Modify: `app/onboarding/page.tsx`
- Create: `src/modules/onboarding/presentation/components/goal-selector.tsx`
- Create: `src/modules/onboarding/presentation/components/character-sheet-reveal.tsx`

- [ ] **Step 1: Criar GoalSelector**

Crie `src/modules/onboarding/presentation/components/goal-selector.tsx`:

```typescript
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
        Escolha até {MAX_SELECTIONS}. {selected.size > 0 ? `${selected.size} selecionado${selected.size > 1 ? "s" : ""}.` : ""}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const isSelected = selected.has(goal.value);
          const isDisabled = !isSelected && selected.size >= MAX_SELECTIONS;
          return (
            <label
              key={goal.value}
              className="block cursor-pointer rounded-lg border p-4 transition-colors"
              style={{
                borderColor: isSelected
                  ? "var(--color-gold)"
                  : "var(--color-hairline)",
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
```

- [ ] **Step 2: Criar CharacterSheetReveal**

Crie `src/modules/onboarding/presentation/components/character-sheet-reveal.tsx`:

```typescript
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
            background: "var(--color-surface)",
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
                  background: "linear-gradient(90deg, var(--color-teal), var(--color-gold))",
                  boxShadow: "0 0 6px 1px oklch(0.78 0.09 85 / 0.4)",
                }}
              />
            </div>
            <span className="text-xs" style={{ color: "var(--color-gold)" }}>
              Nv. 1
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Redesenhar a página de onboarding**

Substitua o conteúdo de `app/onboarding/page.tsx`:

```typescript
import { completeOnboardingAction } from "@/modules/onboarding/presentation/onboarding.actions";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import { PRODUCT_EVENT_NAME } from "@/modules/analytics/domain/product-event-catalog";
import { CULTIVATION_GOAL_OPTIONS } from "@/modules/onboarding/domain/cultivation-goal";
import { GoalSelector } from "@/modules/onboarding/presentation/components/goal-selector";
import { CharacterSheetReveal } from "@/modules/onboarding/presentation/components/character-sheet-reveal";
import { requireAppUser } from "@/shared/auth/route-guards";
import { redirect } from "next/navigation";

const REVEAL_ATTRIBUTES = [
  { name: "Concentração", emoji: "🧠", level: 10 },
  { name: "Energia", emoji: "⚡", level: 10 },
  { name: "Disciplina", emoji: "🔥", level: 10 },
  { name: "Resiliência", emoji: "🛡️", level: 10 },
];

async function OnboardingPage() {
  const user = await requireAppUser();
  if (user.profile?.onboardingDone) {
    redirect("/dashboard");
  }

  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.ONBOARDING_STARTED,
    userId: user.id,
    properties: { entryPoint: "onboarding_page" },
  });

  return (
    <div
      className="min-h-screen px-4 py-10 pb-28 sm:px-6 sm:py-14"
      style={{ background: "var(--color-background)" }}
    >
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <p className="hexis-eyebrow">Criação de personagem</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          O que você quer desenvolver?
        </h1>
        <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--color-muted)" }}>
          Escolha até 4 objetivos. Cada ação que você registrar vai mover esses atributos.
          Você pode mudar o foco depois.
        </p>

        <form id="onboarding-form" action={completeOnboardingAction} className="mt-8 space-y-6">
          {/* Seleção de objetivos */}
          <section>
            <GoalSelector goals={CULTIVATION_GOAL_OPTIONS} />
          </section>

          {/* Prévia da ficha */}
          <section className="hexis-card p-5">
            <p className="hexis-eyebrow mb-4">Sua ficha inicial</p>
            <p className="mb-4 text-xs" style={{ color: "var(--color-muted)" }}>
              Atributos base de todos os personagens. Seus objetivos os direcionam mais rápido.
            </p>
            <CharacterSheetReveal attributes={REVEAL_ATTRIBUTES} />
          </section>

          {/* Como funciona */}
          <section className="hexis-card p-4">
            <p className="hexis-eyebrow mb-2">Como funciona</p>
            <ul className="grid gap-1.5 text-xs sm:grid-cols-2" style={{ color: "var(--color-muted)" }}>
              <li>Registre o que você fez — treino, leitura, meditação, qualquer coisa.</li>
              <li>Seus atributos sobem com cada ação. Ações intensas sobem mais.</li>
              <li>Sem registro por dias, os atributos começam a cair. Mantenha o ritmo.</li>
              <li>Recomendações te dizem o que focar com base no estado atual.</li>
            </ul>
          </section>

          {/* CTA desktop */}
          <div className="hidden justify-end pt-1 sm:flex">
            <button
              className="min-h-11 rounded-md px-6 py-2.5 text-sm font-semibold"
              style={{
                background: "var(--color-gold)",
                color: "var(--color-gold-foreground)",
              }}
            >
              Entrar no painel
            </button>
          </div>
        </form>
      </div>

      {/* CTA mobile */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t px-4 py-3 backdrop-blur sm:hidden"
        style={{
          background: "oklch(0.18 0.008 260 / 0.95)",
          borderColor: "var(--color-hairline)",
        }}
      >
        <button
          form="onboarding-form"
          className="min-h-11 w-full rounded-md text-sm font-semibold"
          style={{
            background: "var(--color-gold)",
            color: "var(--color-gold-foreground)",
          }}
        >
          Entrar no painel
        </button>
      </div>
    </div>
  );
}

export { OnboardingPage as default };
```

- [ ] **Step 4: Verificar compilação**

```bash
cd /Users/lucasferreira/git/hexis && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add app/onboarding/page.tsx src/modules/onboarding/presentation/components/
git commit -m "feat: redesign onboarding as character creation with goal selector"
```

---

### Task 7: Redesenhar o painel principal (dashboard)

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Substituir o conteúdo da página**

Substitua `app/dashboard/page.tsx` pelo seguinte (mantendo toda a lógica de dados existente, alterando apenas a apresentação e o copy):

```typescript
import Link from "next/link";
import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { AttributeScale } from "@/modules/shared/presentation/components/attribute-scale";
import { StatusBadge } from "@/modules/shared/presentation/components/status-badge";
import { XpBar } from "@/modules/shared/presentation/components/xp-bar";
import { computeLevel } from "@/modules/shared/application/level";
import { requireOnboardedUser } from "@/shared/auth/route-guards";
import { readDashboard } from "@/modules/attributes/application/read-dashboard.query";
import { syncCultivationStateAction } from "@/modules/decay/presentation/sync.actions";
import { readRetentionView } from "@/modules/retention/application/read-retention.query";
import { runRetentionAction } from "@/modules/retention/presentation/retention.actions";
import { readUserLoopView } from "@/modules/loops/application/read-user-loop.query";
import { RecommendationItem } from "@/modules/recommendations/presentation/components/recommendation-item";
import { readUserOnboardingContext } from "@/modules/onboarding/application/read-onboarding-context.query";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import { PRODUCT_EVENT_NAME } from "@/modules/analytics/domain/product-event-catalog";

async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireOnboardedUser();
  const emptySearchParams: Record<string, string | string[] | undefined> = {};
  const [dashboard, onboardingContext, retentionView, userLoop, resolvedSearchParams] =
    await Promise.all([
      readDashboard(user.id),
      readUserOnboardingContext(user.id),
      readRetentionView(user.id, new Date()),
      readUserLoopView(user.id),
      searchParams ?? Promise.resolve(emptySearchParams),
    ]);

  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.DASHBOARD_VIEWED,
    userId: user.id,
    properties: { source: "app" },
  });
  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.RETURN_SUMMARY_VIEWED,
    userId: user.id,
    properties: {
      isReturningUser: retentionView.sinceLastVisit.isReturningUser,
      improvedCount: retentionView.sinceLastVisit.improvedCount,
      declinedCount: retentionView.sinceLastVisit.declinedCount,
      needsAttentionCount: retentionView.sinceLastVisit.needsAttentionCount,
    },
  });

  const primaryRecommendation = dashboard.recommendations[0];
  const secondaryRecommendations = dashboard.recommendations.slice(1);
  const atRiskOrDecaying = dashboard.attributes
    .filter((a) => a.status === "AT_RISK" || a.status === "DECAYING")
    .slice(0, 4);
  const strongestMomentum = dashboard.attributes
    .filter((a) => a.status === "IMPROVING")
    .slice(0, 4);
  const snapshotAttributes = dashboard.attributes.slice(0, 4);
  const { level, currentXp, maxXp } = computeLevel(dashboard.composite);

  const recommendedLogHref = onboardingContext
    ? `/log?source=dashboard_goal&goal=${onboardingContext.cultivationGoal.value}`
    : "/log";

  if (primaryRecommendation) {
    await trackProductEventSafely({
      eventName: PRODUCT_EVENT_NAME.RECOMMENDATION_RATIONALE_VIEWED,
      userId: user.id,
      properties: { recommendationId: primaryRecommendation.id, surface: "dashboard" },
    });
  }

  return (
    <AppShell
      title={user.profile?.displayName ?? "Personagem"}
      eyebrow="Painel"
      currentPath="/dashboard"
      displayName={user.profile?.displayName ?? user.email}
      actions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link href="/attributes" className="hexis-button-secondary px-3 py-2 text-sm">
            Habilidades
          </Link>
          <Link
            href={recommendedLogHref}
            className="min-h-11 rounded-md px-4 py-2 text-sm font-semibold"
            style={{ background: "var(--color-gold)", color: "var(--color-gold-foreground)" }}
          >
            Registrar ação
          </Link>
        </div>
      }
    >
      {/* XP Bar */}
      <section className="hexis-card mb-6 p-4 sm:p-5">
        <XpBar level={level} currentXp={currentXp} maxXp={maxXp} />
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Stat label="Em Alta" value={`${dashboard.improvingCount}`} />
          <Stat label="Precisam de atenção" value={`${dashboard.needsCareCount}`} />
          <Stat label="Pontuação" value={`${dashboard.composite.toFixed(1)}`} />
        </div>
      </section>

      {/* Missão sugerida */}
      <section className="hexis-card mb-6 p-5 sm:p-6">
        <h2 className="text-base font-semibold">Missão sugerida</h2>
        {primaryRecommendation ? (
          <ul className="mt-3">
            <RecommendationItem recommendation={primaryRecommendation} allowActions />
          </ul>
        ) : (
          <p className="mt-3 text-sm" style={{ color: "var(--color-muted)" }}>
            Nenhuma missão crítica agora. Continue registrando ações para manter o momentum.
          </p>
        )}
      </section>

      {/* Precisa de atenção + Em Alta */}
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="hexis-card p-4 sm:p-5">
          <p className="hexis-eyebrow">Precisa de atenção</p>
          <ul className="mt-3 space-y-2">
            {atRiskOrDecaying.length === 0 ? (
              <li className="text-sm" style={{ color: "var(--color-muted)" }}>
                Nenhum declínio crítico detectado.
              </li>
            ) : (
              atRiskOrDecaying.map((attribute) => (
                <li
                  key={attribute.userAttributeId}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                  style={{ borderColor: "var(--color-hairline)", background: "var(--color-background)" }}
                >
                  <div>
                    <p className="text-sm font-medium">{attribute.name}</p>
                    <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                      Atual {attribute.currentValue.toFixed(1)} · Base {attribute.baseValue.toFixed(1)}
                    </p>
                  </div>
                  <Link
                    href={`/attributes/${attribute.slug}`}
                    className="flex self-stretch items-center pl-4 text-xs"
                    style={{ color: "var(--color-gold)" }}
                  >
                    Ver
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="hexis-card p-4 sm:p-5">
          <p className="hexis-eyebrow">Em Alta</p>
          <ul className="mt-3 space-y-2">
            {strongestMomentum.length === 0 ? (
              <li className="text-sm" style={{ color: "var(--color-muted)" }}>
                Nenhum atributo em alta ainda. Registre uma ação focada para construir tendência.
              </li>
            ) : (
              strongestMomentum.map((attribute) => (
                <li
                  key={attribute.userAttributeId}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                  style={{ borderColor: "var(--color-hairline)", background: "var(--color-background)" }}
                >
                  <div>
                    <p className="text-sm font-medium">{attribute.name}</p>
                    <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                      {attribute.currentValue.toFixed(1)} atual · {attribute.potentialValue.toFixed(1)} potencial
                    </p>
                  </div>
                  <StatusBadge status={attribute.status} />
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      {/* Snapshot de habilidades */}
      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="hexis-eyebrow">Snapshot</p>
            <h2 className="text-xl font-semibold">Suas habilidades</h2>
          </div>
          <Link href="/attributes" className="hexis-button-secondary px-3 py-1.5 text-xs">
            Ver todas
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {snapshotAttributes.map((attribute) => (
            <Link
              key={attribute.slug}
              href={`/attributes/${attribute.slug}`}
              className="hexis-card block p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--color-muted)" }}>
                    {attribute.shortCode}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{attribute.name}</h3>
                </div>
                <StatusBadge status={attribute.status} />
              </div>
              <div className="mt-3">
                <p className="text-3xl font-semibold">{attribute.currentValue.toFixed(1)}</p>
              </div>
              <div className="mt-3">
                <AttributeScale
                  currentValue={attribute.currentValue}
                  baseValue={attribute.baseValue}
                  potentialValue={attribute.potentialValue}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Atividade recente */}
      <aside className="hexis-card mt-6 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <p className="hexis-eyebrow">Ações recentes</p>
          <Link
            href="/history"
            className="text-xs"
            style={{ color: "var(--color-muted)" }}
          >
            Ver histórico
          </Link>
        </div>
        {dashboard.recentEvents.length === 0 ? (
          <p className="mt-3 text-sm" style={{ color: "var(--color-muted)" }}>
            Nenhuma ação ainda. Registre a primeira para começar a evoluir.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {dashboard.recentEvents.map((event) => (
              <li key={event.id} className="border-b pb-3 last:border-b-0 last:pb-0" style={{ borderColor: "var(--color-hairline)" }}>
                <p className="text-sm">{event.title}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
                  {event.eventType} · {event.intensity}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
                  {event.occurredAt.toLocaleString("pt-BR")} · {event.impacts.length} atributo(s)
                </p>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Missões adicionais */}
      {secondaryRecommendations.length > 0 && (
        <section className="hexis-card mt-6 p-4 sm:p-5">
          <p className="hexis-eyebrow">Outras missões</p>
          <ul className="mt-3 space-y-3">
            {secondaryRecommendations.map((recommendation) => (
              <RecommendationItem
                key={recommendation.id}
                recommendation={recommendation}
                allowActions
              />
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3" style={{ background: "var(--color-background)", borderColor: "var(--color-hairline)" }}>
      <p className="hexis-eyebrow">{label}</p>
      <p className="mt-1.5 text-xl font-semibold">{value}</p>
    </div>
  );
}

export { DashboardPage as default };
```

- [ ] **Step 2: Verificar compilação**

```bash
cd /Users/lucasferreira/git/hexis && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: redesign dashboard with XP bar, Portuguese copy, and RPG vocabulary"
```

---

### Task 8: Criar componente de feedback pós-ação

**Files:**
- Create: `src/modules/evidence/presentation/components/action-feedback.tsx`

- [ ] **Step 1: Criar o componente**

```typescript
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
  },
  MODERATE: {
    headline: "Bom progresso.",
    sub: "Atributos em movimento.",
    glowColor: "var(--color-gold)",
    showFlash: false,
    showParticles: true,
  },
  INTENSE: {
    headline: "Ação de alto impacto.",
    sub: "Seus atributos subiram significativamente.",
    glowColor: "var(--color-gold)",
    showFlash: true,
    showParticles: true,
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
    <div className="relative overflow-hidden rounded-lg border p-5" style={{ borderColor: config.glowColor, background: "var(--color-surface)" }}>
      {/* Flash overlay para INTENSE */}
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
        <p
          className="text-lg font-semibold"
          style={{ color: config.glowColor }}
        >
          {config.headline}
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
          {config.sub}
        </p>

        {/* Partículas visuais para MODERATE e INTENSE */}
        {config.showParticles && (
          <div className="my-3 flex gap-1">
            {[...Array(intensity === "INTENSE" ? 5 : 3)].map((_, i) => (
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

        {/* Impactos */}
        {impacts.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {impacts.slice(0, 3).map((impact) => (
              <li key={impact.attributeName} className="flex items-center gap-2 text-sm">
                <span
                  className="text-xs font-semibold"
                  style={{ color: impact.deltaCurrent >= 0 ? "var(--color-positive)" : "var(--color-critical)" }}
                >
                  {impact.deltaCurrent >= 0 ? "+" : ""}{impact.deltaCurrent.toFixed(2)}
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
```

- [ ] **Step 2: Verificar compilação**

```bash
cd /Users/lucasferreira/git/hexis && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/evidence/presentation/components/action-feedback.tsx
git commit -m "feat: add ActionFeedback component with intensity-based animations"
```

---

### Task 9: Redesenhar e traduzir o formulário de log

**Files:**
- Modify: `src/modules/evidence/presentation/components/log-evidence-form.tsx`
- Modify: `app/log/page.tsx`

- [ ] **Step 1: Traduzir copy e simplificar fluxo no log-evidence-form**

Localize e atualize as seguintes strings em `src/modules/evidence/presentation/components/log-evidence-form.tsx`:

| Antes | Depois |
|-------|--------|
| `"Training"` (label) | `"Treino"` |
| `"Practice"` (label) | `"Prática"` |
| `"Routine"` (label) | `"Rotina"` |
| `"Achievement"` (label) | `"Conquista"` |
| `"Recovery"` (label) | `"Recuperação"` |
| `"Deliberate work on skill strength and consistency."` | `"Trabalho deliberado em força e consistência."` |
| `"Short focused repetitions to retain sharpness."` | `"Repetições curtas e focadas para manter a precisão."` |
| `"Maintenance habits that prevent drift."` | `"Hábitos de manutenção que evitam o declínio."` |
| `"A meaningful result that confirms execution quality."` | `"Um resultado significativo que confirma qualidade."` |
| `"Restorative behavior that protects sustainable output."` | `"Comportamento restaurador que protege o rendimento."` |
| `"Light"` (intensidade) | `"Leve"` |
| `"Moderate"` (intensidade) | `"Moderado"` |
| `"Intense"` (intensidade) | `"Intenso"` |
| `"Low load, consistency-oriented."` | `"Carga baixa, orientado à consistência."` |
| `"Balanced training load."` | `"Carga equilibrada."` |
| `"High effort and adaptation demand."` | `"Alto esforço e demanda de adaptação."` |
| `"Evidence type"` (eyebrow) | `"Tipo de ação"` |
| `"What happened"` (eyebrow) | `"O que você fez"` |
| `"Title"` (label input) | `"Descrição"` |
| `"e.g. 90-minute deep work block"` (placeholder) | `"ex: 1 hora de treino funcional"` |
| `"Add notes (optional)"` | `"Adicionar notas (opcional)"` |
| `"What made this work, what to repeat next time"` | `"O que funcionou, o que repetir"` |
| `"Adjust load and timing (optional)"` | `"Ajustar carga e horário (opcional)"` |
| `"Intensity"` | `"Intensidade"` |
| `"Occurred at"` | `"Quando ocorreu"` |
| `"Affected attributes"` | `"Habilidades afetadas"` |
| `"Use suggested"` | `"Usar sugestão"` |
| `"Clear"` | `"Limpar"` |
| `"Suggested for"` | `"Sugerido para"` |
| `"Goal priority"` | `"Prioridade do objetivo"` |
| `"No suggestions"` | `"Sem sugestões"` |
| `"No direct mapping"` | `"Sem mapeamento direto"` |
| `"suggested"` (badge) | `"sugerido"` |
| `"Impact summary"` (eyebrow) | `"Resumo de impacto"` |
| `"Select at least one attribute to log meaningful evidence."` | `"Selecione ao menos uma habilidade."` |
| `"Saving..."` | `"Salvando..."` |
| `"Save log"` | `"Registrar"` |
| `"Evidence recorded"` | `"Ação registrada"` |
| `"Continue to dashboard"` | `"Ir ao painel"` |
| `"Log another"` | `"Registrar outra"` |
| `"Review full history"` | `"Ver histórico completo"` |
| `"attribute impact(s)"` | `"atributo(s)"` |
| `"current"` (impacto) | `"atual"` |
| `"Review the highlighted sections below."` | `"Revise as seções destacadas abaixo."` |
| `"Submission persists event..."` | `"O registro atualiza seus atributos permanentemente."` |

- [ ] **Step 2: Integrar ActionFeedback no lugar do banner de sucesso atual**

Encontre o bloco `{state.status === "success" && state.successSummary && !hideSuccess ? ...}` em `log-evidence-form.tsx` e substitua-o por:

```typescript
{state.status === "success" && state.successSummary && !hideSuccess ? (
  <div className="lg:col-span-12">
    <ActionFeedback
      intensity={intensity as "LIGHT" | "MODERATE" | "INTENSE"}
      impacts={state.successSummary.impacts}
      onDismiss={() => {
        formRef.current?.reset();
        setSelectedAttributeIds(suggestedSelectionForEventType(initialEventType));
        setEventType(initialEventType);
        setIntensity(DEFAULT_INTENSITY);
        setHideSuccess(true);
      }}
    />
  </div>
) : null}
```

Adicione o import no topo do arquivo:

```typescript
import { ActionFeedback } from "@/modules/evidence/presentation/components/action-feedback";
```

- [ ] **Step 3: Traduzir a página log/page.tsx**

Em `app/log/page.tsx`, atualize:

```typescript
// title e eyebrow do AppShell
title="Registrar ação"
eyebrow="Ação"

// texto de orientação
<p className="max-w-3xl text-sm" style={{ color: "var(--color-muted)" }}>
  Registre o que você fez — treino, leitura, trabalho focado, qualquer coisa que moveu um atributo.
</p>

// banner de objetivo
<p className="text-sm font-medium">Foco sugerido: {goalGuidance.label}</p>
<p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
  Registre uma ação alinhada a esse objetivo para o Hexis calibrar sua próxima missão.
</p>
```

- [ ] **Step 4: Verificar compilação**

```bash
cd /Users/lucasferreira/git/hexis && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/modules/evidence/presentation/components/log-evidence-form.tsx app/log/page.tsx
git commit -m "feat: translate log form to Portuguese and integrate ActionFeedback"
```

---

### Task 10: Traduzir páginas restantes para português

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/attributes/page.tsx`
- Modify: `app/history/page.tsx`
- Modify: `app/weekly-review/page.tsx`
- Modify: `app/settings/page.tsx`
- Modify: `app/profile/page.tsx`

- [ ] **Step 1: Traduzir landing page (`app/page.tsx`)**

```typescript
// Substitua os textos:
<p className="hexis-eyebrow">Hexis</p>
<h1 ...>
  Evolua seus atributos com ações reais.
</h1>
<p ...>
  Hexis é um RPG de vida real. Registre o que você faz, veja seus atributos subirem, receba missões baseadas no seu estado atual.
</p>
<p ...>
  Começa com uma calibração inicial. Primeiros registros personalizam tudo rapidamente.
</p>
<button ...>Criar conta</button>
<button ...>Entrar</button>

// Coluna direita:
<p className="hexis-eyebrow">O que esperar</p>
<ul ...>
  <li>Atributos visíveis de 0 a 20, com movimento explicável.</li>
  <li>Valores iniciais são âncoras de calibração, não um julgamento sobre você.</li>
  <li>Cada ação registrada move seus atributos e influencia as missões sugeridas.</li>
  <li>Resumos de retorno e revisão semanal mantém o foco no que importa agora.</li>
</ul>
<p ...>Ao continuar, você concorda com os termos de teste do produto.</p>
```

- [ ] **Step 2: Traduzir página de atributos (`app/attributes/page.tsx`)**

```typescript
title="Habilidades"
eyebrow="Ficha"

// descrição
<p ...>
  Cada habilidade tem dinâmicas independentes: atual move mais rápido, base move mais devagar, potencial move mais lento.
</p>
```

- [ ] **Step 3: Traduzir demais páginas**

Para cada arquivo abaixo, abra-o e substitua todos os textos visíveis ao usuário por equivalentes em português, seguindo o mapeamento de vocabulário da spec:

- `app/history/page.tsx` — "Histórico", "Ações", "Sem ações registradas ainda."
- `app/weekly-review/page.tsx` — "Revisão semanal", todas as labels e descrições
- `app/settings/page.tsx` — "Configurações", labels de campos
- `app/profile/page.tsx` — "Perfil", labels de campos

- [ ] **Step 4: Verificar compilação**

```bash
cd /Users/lucasferreira/git/hexis && npx tsc --noEmit
```

- [ ] **Step 5: Rodar todos os testes**

```bash
cd /Users/lucasferreira/git/hexis && npx vitest run
```

Expected: todos os testes passam (os testes de domínio são de lógica, não de copy).

- [ ] **Step 6: Commit final**

```bash
git add app/page.tsx app/attributes/page.tsx app/history/page.tsx app/weekly-review/page.tsx app/settings/page.tsx app/profile/page.tsx
git commit -m "feat: translate remaining pages to Portuguese"
```

---

## Self-review

**Cobertura da spec:**
- ✅ Estética dark: já existia, css com glow/animações adicionado em Task 4
- ✅ Linguagem PT: Tasks 1, 3, 7, 8, 9, 10
- ✅ Onboarding como criação de personagem: Task 6 (GoalSelector + CharacterSheetReveal + página)
- ✅ 10 objetivos com emoji e descrição: Task 2
- ✅ Máximo 4 selecionados: GoalSelector component em Task 6
- ✅ XP bar no painel: Task 5 + Task 7
- ✅ Missões sugeridas (recommendations em PT): Task 7
- ✅ Feedback pós-log com animação por intensidade: Tasks 8 + 9
- ✅ Descrições visíveis nos objetivos: GoalSelector (Task 6) e spec nota que ficam na ficha também

**Itens fora de escopo (v1):** objetivos custom, som/haptic, conquistas/achievements, modo social.

**Consistência de tipos:**
- `CultivationGoalOption` agora inclui `emoji` — `CultivationGoalView` também inclui `emoji` — consistente ao longo das tasks.
- `computeLevel` retorna `{ level, currentXp, maxXp }` — usado exatamente assim em Task 7.
- `ActionFeedback` recebe `intensity` como `"LIGHT" | "MODERATE" | "INTENSE"` — `log-evidence-form` já tem `intensity` como estado string, cast explícito adicionado na Task 9.
