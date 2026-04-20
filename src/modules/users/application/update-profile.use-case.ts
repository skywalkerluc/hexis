import { z } from "zod";
import { prismaClient } from "@/shared/db/prisma-client";

const updateProfileSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().min(2).max(64),
  avatarOptionId: z.string().min(1),
  timezone: z.string().min(2).max(80),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export async function updateProfileUseCase(input: UpdateProfileInput): Promise<void> {
  const parsed = updateProfileSchema.parse(input);

  await prismaClient.profile.update({
    where: { userId: parsed.userId },
    data: {
      displayName: parsed.displayName,
      avatarOptionId: parsed.avatarOptionId,
      timezone: parsed.timezone,
    },
  });
}
