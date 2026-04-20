import { z } from "zod";
import { createSessionForUser } from "@/modules/auth/application/session.service";
import { verifyPassword } from "@/modules/auth/infrastructure/password.service";
import { prismaClient } from "@/shared/db/prisma-client";

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export async function loginUseCase(input: LoginInput): Promise<{ sessionToken: string }> {
  const parsed = loginInputSchema.parse(input);
  const user = await prismaClient.user.findUnique({ where: { email: parsed.email } });
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isValidPassword = await verifyPassword(parsed.password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error("Invalid credentials");
  }

  const sessionToken = await createSessionForUser(user.id);
  return { sessionToken };
}
