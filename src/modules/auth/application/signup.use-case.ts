import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "@/modules/auth/domain/auth.constants";
import { hashPassword } from "@/modules/auth/infrastructure/password.service";
import { createSessionForUser } from "@/modules/auth/application/session.service";
import { prismaClient } from "@/shared/db/prisma-client";
import { bootstrapUser } from "@/modules/users/application/bootstrap-user.use-case";

export const signupInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(PASSWORD_MIN_LENGTH),
  displayName: z.string().min(2).max(64),
});

export type SignupInput = z.infer<typeof signupInputSchema>;

export async function signupUseCase(input: SignupInput): Promise<{ sessionToken: string }> {
  const parsed = signupInputSchema.parse(input);
  const existingUser = await prismaClient.user.findUnique({ where: { email: parsed.email } });
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const passwordHash = await hashPassword(parsed.password);
  const user = await prismaClient.user.create({
    data: {
      email: parsed.email,
      passwordHash,
    },
  });

  await bootstrapUser({ userId: user.id, displayName: parsed.displayName });

  const sessionToken = await createSessionForUser(user.id);
  return { sessionToken };
}
