"use server";

import { revalidatePath } from "next/cache";
import { recalculateDecayForUser } from "@/modules/decay/application/decay-recalculation.service";
import { generateRecommendationsForUser } from "@/modules/recommendations/application/generate-recommendations.use-case";
import { requireOnboardedUser } from "@/shared/auth/route-guards";

export async function syncCultivationStateAction(): Promise<void> {
  const user = await requireOnboardedUser();
  const now = new Date();

  await recalculateDecayForUser({ userId: user.id, now });
  await generateRecommendationsForUser({ userId: user.id, now });

  revalidatePath("/dashboard");
  revalidatePath("/attributes");
  revalidatePath("/history");
}
