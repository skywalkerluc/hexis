import Link from "next/link";
import { logoutAction } from "@/modules/auth/presentation/auth.actions";

const NAV_ITEMS: readonly { href: string; label: string }[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/attributes", label: "Attributes" },
  { href: "/log", label: "Log" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Account" },
  { href: "/settings", label: "Settings" },
] as const;

const MOBILE_NAV_ITEMS: readonly { href: string; label: string }[] = [
  { href: "/dashboard", label: "Home" },
  { href: "/log", label: "Log" },
  { href: "/weekly-review", label: "Review" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Account" },
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
  if (itemPath === "/settings") {
    return currentPath.startsWith("/settings") || currentPath.startsWith("/profile");
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
  const feedbackHref = `/feedback?from=${encodeURIComponent(currentPath)}`;
  const showFeedbackAction = currentPath !== "/feedback";

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
          {showFeedbackAction ? (
            <Link
              href={feedbackHref}
              className="hexis-button-secondary px-3 py-1.5 text-xs"
            >
              Send feedback
            </Link>
          ) : null}
          <p className="mt-2 text-sm">{displayName}</p>
          <form action={logoutAction} className="mt-2">
            <button className="hexis-button-secondary px-3 py-1.5 text-xs">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header
          className="sticky top-0 z-10 border-b px-4 py-3 backdrop-blur sm:px-5 lg:px-10 lg:py-4"
          style={{ background: "color-mix(in oklab, var(--color-background) 88%, transparent)" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              {eyebrow ? <p className="hexis-eyebrow">{eyebrow}</p> : null}
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              {showFeedbackAction ? (
                <Link
                  href={feedbackHref}
                  className="hidden min-h-10 rounded-md border bg-[var(--color-surface)] px-2.5 py-1.5 text-xs text-[var(--color-foreground)] sm:inline-flex sm:items-center"
                >
                  Feedback
                </Link>
              ) : null}
              {actions}
            </div>
          </div>
        </header>
        <main className="px-4 py-6 pb-24 sm:px-5 lg:px-10 lg:py-8 lg:pb-8">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t px-2 py-2 backdrop-blur lg:hidden"
        style={{
          background: "color-mix(in oklab, var(--color-surface) 92%, transparent)",
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(0.5rem, env(safe-area-inset-left))",
          paddingRight: "max(0.5rem, env(safe-area-inset-right))",
        }}
      >
        <ul className="grid grid-cols-5 gap-1">
          {MOBILE_NAV_ITEMS.map((item) => {
            const active = isActivePath(currentPath, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block min-h-12 rounded-md px-2 py-2.5 text-center text-xs"
                  style={{
                    color: active ? "var(--color-foreground)" : "var(--color-muted)",
                    background: active ? "var(--color-surface-raised)" : "transparent",
                  }}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
