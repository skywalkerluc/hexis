"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginUseCase } from "@/modules/auth/application/login.use-case";
import { logoutUseCase } from "@/modules/auth/application/logout.use-case";
import { signupUseCase } from "@/modules/auth/application/signup.use-case";
import { sessionCookieName } from "@/modules/auth/application/session.service";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import {
  PRODUCT_EVENT_NAME,
  RETURN_SESSION_MIN_HOURS_AFTER_SIGNUP,
} from "@/modules/analytics/domain/product-event-catalog";
import { clearSessionCookie, setSessionCookie } from "@/shared/auth/server-session";

const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const HOURS_PER_DAY = 24;

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

  const { sessionToken, userId } = await signupUseCase({ email, password, displayName });
  await setSessionCookie(sessionToken);
  await trackProductEventSafely({
    eventName: PRODUCT_EVENT_NAME.SIGNUP_COMPLETED,
    userId,
    properties: {
      entryPoint: "signup_form",
    },
  });

  redirect("/onboarding");
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = readRequiredText(formData, "email");
  const password = readRequiredText(formData, "password");

  const { sessionToken, userId, signupAt } = await loginUseCase({ email, password });
  await setSessionCookie(sessionToken);
  const signupAgeMs = Date.now() - signupAt.getTime();
  const minReturnSessionAgeMs =
    RETURN_SESSION_MIN_HOURS_AFTER_SIGNUP *
    MINUTES_PER_HOUR *
    SECONDS_PER_MINUTE *
    MILLISECONDS_PER_SECOND;
  if (signupAgeMs >= minReturnSessionAgeMs) {
    await trackProductEventSafely({
      eventName: PRODUCT_EVENT_NAME.RETURN_SESSION_AFTER_SIGNUP,
      userId,
      properties: {
        daysSinceSignup:
          signupAgeMs /
          (HOURS_PER_DAY *
            MINUTES_PER_HOUR *
            SECONDS_PER_MINUTE *
            MILLISECONDS_PER_SECOND),
      },
    });
  }

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
