"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginUseCase } from "@/modules/auth/application/login.use-case";
import { logoutUseCase } from "@/modules/auth/application/logout.use-case";
import { signupUseCase } from "@/modules/auth/application/signup.use-case";
import { sessionCookieName } from "@/modules/auth/application/session.service";
import { clearSessionCookie, setSessionCookie } from "@/shared/auth/server-session";

function readRequiredText(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string") {
    throw new Error(`Missing field: ${key}`);
  }
  return value.trim();
}

export async function signupAction(formData: FormData): Promise<void> {
  const email = readRequiredText(formData, "email");
  const password = readRequiredText(formData, "password");
  const displayName = readRequiredText(formData, "displayName");

  const { sessionToken } = await signupUseCase({ email, password, displayName });
  await setSessionCookie(sessionToken);

  redirect("/onboarding");
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = readRequiredText(formData, "email");
  const password = readRequiredText(formData, "password");

  const { sessionToken } = await loginUseCase({ email, password });
  await setSessionCookie(sessionToken);

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName())?.value;

  if (token) {
    await logoutUseCase(token);
  }

  await clearSessionCookie();
  redirect("/login");
}
