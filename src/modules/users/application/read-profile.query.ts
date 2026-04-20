import { prismaClient } from "@/shared/db/prisma-client";

export type UserProfileView = {
  displayName: string;
  email: string;
  avatarOptionId: string;
  onboardingDone: boolean;
  timezone: string;
  availableAvatars: {
    id: string;
    code: string;
    label: string;
    background: string;
    ring: string;
    mark: string;
  }[];
};

export async function readUserProfile(userId: string): Promise<UserProfileView | null> {
  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
    },
  });
  if (!user?.profile) {
    return null;
  }

  const avatars = await prismaClient.avatarOption.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return {
    displayName: user.profile.displayName,
    email: user.email,
    avatarOptionId: user.profile.avatarOptionId,
    onboardingDone: user.profile.onboardingDone,
    timezone: user.profile.timezone,
    availableAvatars: avatars.map((avatar) => ({
      id: avatar.id,
      code: avatar.code,
      label: avatar.label,
      background: avatar.background,
      ring: avatar.ring,
      mark: avatar.mark,
    })),
  };
}
