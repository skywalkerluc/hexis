"use server";

import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/shared/auth/route-guards";
import { updateProfileUseCase } from "@/modules/users/application/update-profile.use-case";

export async function updateProfileAction(formData: FormData): Promise<void> {
  const user = await requireOnboardedUser();
  const displayNameValue = formData.get("displayName");
  const avatarOptionIdValue = formData.get("avatarOptionId");
  const timezoneValue = formData.get("timezone");

  if (typeof displayNameValue !== "string") {
    throw new Error("Display name is required.");
  }
  if (typeof avatarOptionIdValue !== "string") {
    throw new Error("Avatar option is required.");
  }
  if (typeof timezoneValue !== "string") {
    throw new Error("Timezone is required.");
  }

  await updateProfileUseCase({
    userId: user.id,
    displayName: displayNameValue,
    avatarOptionId: avatarOptionIdValue,
    timezone: timezoneValue,
  });

  redirect("/profile");
}
