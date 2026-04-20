import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  readSessionUser,
  sessionCookieName,
  sessionTtlDays,
  type SessionUser,
} from "@/modules/auth/application/session.service";
import { addDays } from "@/modules/decay/domain/time";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName())?.value;
  if (!token) {
    return null;
  }

  return readSessionUser(token);
}

export async function requireCurrentUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function setSessionCookie(rawToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName(), rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: addDays(new Date(), sessionTtlDays()),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName());
}
