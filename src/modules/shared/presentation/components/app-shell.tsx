import Link from "next/link";
import { logoutAction } from "@/modules/auth/presentation/auth.actions";

const NAV_ITEMS: readonly { href: string; label: string }[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/attributes", label: "Attributes" },
  { href: "/log", label: "Log" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
] as const;

export type AppShellProps = {
  title: string;
  eyebrow?: string;
  currentPath: string;
  displayName: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

function isActivePath(currentPath: string, itemPath: string): boolean {
  if (currentPath === itemPath) {
    return true;
  }
  if (itemPath === "/dashboard") {
    return false;
  }
  return currentPath.startsWith(itemPath);
}

export function AppShell({
  title,
  eyebrow,
  currentPath,
  displayName,
  actions,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-[var(--color-surface)] lg:flex lg:flex-col">
        <div className="border-b px-5 py-4">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            Hexis
          </Link>
        </div>

        <nav className="flex-1 px-3 py-5">
          <p className="hexis-eyebrow px-3">Practice</p>
          <ul className="mt-2 space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(currentPath, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-sm"
                    style={{
                      color: active
                        ? "var(--color-foreground)"
                        : "var(--color-muted)",
                      background: active
                        ? "color-mix(in oklab, var(--color-surface-raised) 88%, transparent)"
                        : "transparent",
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t p-3">
          <p className="text-sm">{displayName}</p>
          <form action={logoutAction} className="mt-2">
            <button className="rounded-md border px-3 py-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header
          className="sticky top-0 z-10 border-b px-5 py-4 backdrop-blur lg:px-10"
          style={{ background: "color-mix(in oklab, var(--color-background) 88%, transparent)" }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              {eyebrow ? <p className="hexis-eyebrow">{eyebrow}</p> : null}
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            </div>
            {actions}
          </div>
        </header>
        <main className="px-5 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
