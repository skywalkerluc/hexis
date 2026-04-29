import Link from "next/link";
import { cookies } from "next/headers";
import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { logoutAction } from "@/modules/auth/presentation/auth.actions";
import { sessionCookieName } from "@/modules/auth/application/session.service";
import { requireOnboardedUser } from "@/shared/auth/route-guards";

async function SettingsPage() {
  const user = await requireOnboardedUser();
  const cookieStore = await cookies();
  const hasSessionCookie = Boolean(cookieStore.get(sessionCookieName())?.value);

  return (
    <AppShell
      title="Configurações"
      eyebrow="Conta"
      currentPath="/settings"
      displayName={user.profile?.displayName ?? user.email}
    >
      <div className="space-y-5">
        <section className="hexis-card p-6">
          <h2 className="text-lg font-semibold">Atalhos da conta</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/profile" className="hexis-button-secondary px-3 py-2 text-sm">
              Editar perfil
            </Link>
            <Link href="/history" className="hexis-button-secondary px-3 py-2 text-sm">
              Ver histórico
            </Link>
            <form action={logoutAction}>
              <button className="hexis-button-secondary px-3 py-2 text-sm">
                Sair
              </button>
            </form>
          </div>
        </section>

        <section className="hexis-card p-6">
          <h2 className="text-lg font-semibold">Status da conta</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
            Sessão atual: {hasSessionCookie ? "ativa neste dispositivo" : "não ativa"}.
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
            Precisa de ajuda com a conta? Use o feedback para solicitar redefinição de senha.
          </p>
          <Link
            href="/feedback?from=/settings"
            className="hexis-button-secondary mt-3 px-3 py-2 text-sm"
          >
            Solicitar ajuda
          </Link>
        </section>

        <section className="hexis-card p-6">
          <h2 className="text-lg font-semibold">Feedback do produto</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
            Compartilhe atrito, dúvidas ou ideias de melhoria.
          </p>
          <Link
            href="/feedback?from=/settings"
            className="hexis-button-secondary mt-3 px-3 py-2 text-sm"
          >
            Abrir formulário de feedback
          </Link>
        </section>
      </div>
    </AppShell>
  );
}

export { SettingsPage as default };
