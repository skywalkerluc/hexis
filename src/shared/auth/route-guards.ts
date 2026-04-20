import { redirect } from "next/navigation";
import { getCurrentUser, requireCurrentUser } from "@/shared/auth/server-session";
import type { SessionUser } from "@/modules/auth/application/session.service";

export async function requireAnonymousUser(): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    if (user.profile?.onboardingDone) {
      redirect("/dashboard");
    }
    redirect("/onboarding");
  }
}

export async function requireAppUser(): Promise<SessionUser> {
  const user = await requireCurrentUser();
  return user;
}

export async function requireOnboardedUser(): Promise<SessionUser> {
  const user = await requireCurrentUser();
  if (!user.profile?.onboardingDone) {
    redirect("/onboarding");
  }
  return user;
}
