"use server";

import { redirect } from "next/navigation";
import { createEvidenceEventUseCase } from "@/modules/evidence/application/create-evidence-event.use-case";
import { generateRecommendationsForUser } from "@/modules/recommendations/application/generate-recommendations.use-case";
import { requireOnboardedUser } from "@/shared/auth/route-guards";

export async function createEvidenceEventAction(formData: FormData): Promise<void> {
  const user = await requireOnboardedUser();

  const titleValue = formData.get("title");
  const eventTypeValue = formData.get("eventType");
  const intensityValue = formData.get("intensity");
  const occurredAtValue = formData.get("occurredAt");
  const notesValue = formData.get("notes");
  const attributeIds = formData.getAll("attributeId");

  if (typeof titleValue !== "string") {
    throw new Error("Title is required");
  }
  if (typeof eventTypeValue !== "string") {
    throw new Error("Event type is required");
  }
  if (typeof intensityValue !== "string") {
    throw new Error("Intensity is required");
  }
  if (typeof occurredAtValue !== "string") {
    throw new Error("Occurred date is required");
  }

  const resolvedAttributeIds = attributeIds.flatMap((value) =>
    typeof value === "string" && value.length > 0 ? [value] : [],
  );

  await createEvidenceEventUseCase({
    userId: user.id,
    title: titleValue,
    notes: typeof notesValue === "string" && notesValue.length > 0 ? notesValue : undefined,
    eventType: eventTypeValue as "TRAINING" | "PRACTICE" | "ROUTINE" | "ACHIEVEMENT" | "RECOVERY",
    intensity: intensityValue as "LIGHT" | "MODERATE" | "INTENSE",
    occurredAt: new Date(occurredAtValue),
    userAttributeIds: resolvedAttributeIds,
  });

  await generateRecommendationsForUser({ userId: user.id, now: new Date() });

  redirect("/history");
}
