"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { loginUseCase } from "@/modules/auth/application/login.use-case";
import { logoutUseCase } from "@/modules/auth/application/logout.use-case";
import { signupUseCase } from "@/modules/auth/application/signup.use-case";
import { sessionCookieName } from "@/modules/auth/application/session.service";
import { PASSWORD_MIN_LENGTH } from "@/modules/auth/domain/auth.constants";
import { INITIAL_AUTH_FORM_STATE, type AuthFormState } from "@/modules/auth/presentation/auth-form-state";
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

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

export async function signupAction(formData: FormData): Promise<void> {
  await signupFormAction(INITIAL_AUTH_FORM_STATE, formData);
}

export async function loginAction(formData: FormData): Promise<void> {
  await loginFormAction(INITIAL_AUTH_FORM_STATE, formData);
}

function buildInvalidCredentialsState(): AuthFormState {
  return {
    status: "error",
    formError: "Email or password is incorrect.",
    fieldErrors: {
      email: "Check your credentials and try again.",
      password: "Check your credentials and try again.",
    },
  };
}

function buildSignupValidationState(input: {
  displayName: string;
  email: string;
  password: string;
}): AuthFormState | null {
  const fieldErrors: AuthFormState["fieldErrors"] = {};
  if (input.displayName.length < 2) {
    fieldErrors.displayName = "Use at least 2 characters.";
  }
  if (!input.email.includes("@")) {
    fieldErrors.email = "Enter a valid email address.";
  }
  if (input.password.length < PASSWORD_MIN_LENGTH) {
    fieldErrors.password = `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (Object.keys(fieldErrors).length === 0) {
    return null;
  }
  return {
    status: "error",
    formError: "Please correct the highlighted fields.",
    fieldErrors,
  };
}

export async function loginFormAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readText(formData, "email");
  const password = readText(formData, "password");
  if (!email || !password) {
    const fieldErrors: AuthFormState["fieldErrors"] = {};
    if (!email) {
      fieldErrors.email = "Email is required.";
    }
    if (!password) {
      fieldErrors.password = "Password is required.";
    }
    return {
      status: "error",
      formError: "Enter your email and password.",
      fieldErrors,
    };
  }

  try {
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
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Invalid credentials") {
      return buildInvalidCredentialsState();
    }
    return {
      status: "error",
      formError: "Could not sign in right now. Try again.",
      fieldErrors: {},
    };
  }
}

export async function signupFormAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readText(formData, "email");
  const password = readText(formData, "password");
  const displayName = readText(formData, "displayName");
  const validationError = buildSignupValidationState({
    displayName,
    email,
    password,
  });
  if (validationError) {
    return validationError;
  }

  try {
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
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Email already registered") {
      return {
        status: "error",
        formError: "This email is already registered.",
        fieldErrors: {
          email: "Use another email or sign in.",
        },
      };
    }
    if (error instanceof ZodError) {
      return {
        status: "error",
        formError: "Please correct the highlighted fields.",
        fieldErrors: {
          displayName: "Use 2-64 characters.",
          email: "Enter a valid email address.",
          password: `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
        },
      };
    }
    return {
      status: "error",
      formError: "Could not create account right now. Try again.",
      fieldErrors: {},
    };
  }
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
