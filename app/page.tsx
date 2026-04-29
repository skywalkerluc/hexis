import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/shared/auth/server-session";
import { landingCtaAction } from "@/modules/public/presentation/public.actions";

async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    if (user.profile?.onboardingDone) {
      redirect("/dashboard");
    }
    redirect("/onboarding");
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-10" style={{ background: "var(--color-background)", color: "var(--color-foreground)" }}>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        <section className="hexis-card p-6 sm:p-8">
          <p className="hexis-eyebrow">Hexis</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Evolua seus atributos com ações reais.
          </h1>
          <p className="mt-4 text-sm sm:text-base" style={{ color: "var(--color-muted)" }}>
            Hexis é um RPG de vida real. Registre o que você faz, veja seus atributos subirem,
            receba missões baseadas no seu estado atual.
          </p>
          <p className="mt-2 text-xs" style={{ color: "var(--color-muted)" }}>
            Começa com uma calibração inicial. Primeiros registros personalizam tudo rapidamente.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={landingCtaAction}>
              <input type="hidden" name="target" value="signup" />
              <button
                className="min-h-11 rounded-md px-4 py-2 text-sm font-semibold"
                style={{ background: "var(--color-gold)", color: "var(--color-gold-foreground)" }}
              >
                Criar conta
              </button>
            </form>
            <form action={landingCtaAction}>
              <input type="hidden" name="target" value="login" />
              <button className="hexis-button-secondary px-4 py-2 text-sm">
                Entrar
              </button>
            </form>
          </div>
        </section>

        <section className="hexis-card p-6 sm:p-8">
          <p className="hexis-eyebrow">O que esperar</p>
          <ul className="mt-4 space-y-3 text-sm" style={{ color: "var(--color-muted)" }}>
            <li>Atributos visíveis de 0 a 20, com movimento explicável.</li>
            <li>Valores iniciais são âncoras de calibração, não um julgamento sobre você.</li>
            <li>Cada ação registrada move seus atributos e influencia as missões sugeridas.</li>
            <li>Resumos de retorno e revisão semanal mantém o foco no que importa agora.</li>
          </ul>
          <p className="mt-5 text-xs" style={{ color: "var(--color-muted)" }}>
            Ao continuar, você concorda com os termos de teste do produto.
          </p>
          <div className="mt-3 text-xs" style={{ color: "var(--color-muted)" }}>
            <Link href="/login" className="underline underline-offset-2">Já tenho uma conta</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export { HomePage as default };
