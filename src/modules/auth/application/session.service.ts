import { addDays } from "@/modules/decay/domain/time";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_DAYS,
} from "@/modules/auth/domain/auth.constants";
import {
  generateRawSessionToken,
  hashSessionToken,
} from "@/modules/auth/infrastructure/session-token.service";
import { prismaClient } from "@/shared/db/prisma-client";

export type SessionUser = {
  id: string;
  email: string;
  profile: {
    displayName: string;
    onboardingDone: boolean;
    avatarOptionId: string;
  } | null;
};

export async function createSessionForUser(userId: string): Promise<string> {
  const rawToken = generateRawSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = addDays(new Date(), SESSION_TTL_DAYS);

  await prismaClient.authSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return rawToken;
}

export async function deleteSession(rawToken: string): Promise<void> {
  await prismaClient.authSession.deleteMany({
    where: { tokenHash: hashSessionToken(rawToken) },
  });
}

export async function readSessionUser(rawToken: string): Promise<SessionUser | null> {
  const tokenHash = hashSessionToken(rawToken);
  const session = await prismaClient.authSession.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          profile: {
            select: {
              displayName: true,
              onboardingDone: true,
              avatarOptionId: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prismaClient.authSession.delete({ where: { id: session.id } });
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    profile: session.user.profile,
  };
}

export function sessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function sessionTtlDays(): number {
  return SESSION_TTL_DAYS;
}
