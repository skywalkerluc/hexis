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
        <p className="hexis-eyebrow">Criação de personagem</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          O que você quer desenvolver?
        </h1>
        <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--color-muted)" }}>
          Escolha até 4 objetivos. Cada ação que você registrar vai mover esses atributos.
          Você pode mudar o foco depois.
        </p>

        <form id="onboarding-form" action={completeOnboardingAction} className="mt-8 space-y-6">
          <section>
            <GoalSelector goals={CULTIVATION_GOAL_OPTIONS} />
          </section>

          <section className="hexis-card p-5">
            <p className="hexis-eyebrow mb-4">Sua ficha inicial</p>
            <p className="mb-4 text-xs" style={{ color: "var(--color-muted)" }}>
              Atributos base de todos os personagens. Seus objetivos os direcionam mais rápido.
            </p>
            <CharacterSheetReveal attributes={REVEAL_ATTRIBUTES} />
          </section>

          <section className="hexis-card p-4">
            <p className="hexis-eyebrow mb-2">Como funciona</p>
            <ul className="grid gap-1.5 text-xs sm:grid-cols-2" style={{ color: "var(--color-muted)" }}>
              <li>Registre o que você fez — treino, leitura, meditação, qualquer coisa.</li>
              <li>Seus atributos sobem com cada ação. Ações intensas sobem mais.</li>
              <li>Sem registro por dias, os atributos começam a cair. Mantenha o ritmo.</li>
              <li>Recomendações te dizem o que focar com base no estado atual.</li>
            </ul>
          </section>

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
