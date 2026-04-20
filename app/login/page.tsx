import Link from "next/link";
import { LoginForm } from "@/modules/auth/presentation/components/login-form";
import { requireAnonymousUser } from "@/shared/auth/route-guards";

async function LoginPage() {
  await requireAnonymousUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-6">
      <div className="w-full max-w-md">
        <LoginForm />
        <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
          New to Hexis? <Link href="/signup" className="text-[var(--color-foreground)] underline">Create account</Link>
        </p>
      </div>
    </div>
  );
}

export { LoginPage as default };
