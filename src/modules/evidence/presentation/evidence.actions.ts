"use server";

import { z } from "zod";
import { INITIAL_LOG_EVIDENCE_FORM_STATE } from "./evidence.types";
import type { LogEvidenceFormState } from "./evidence.types";
import { createEvidenceEventUseCase } from "@/modules/evidence/application/create-evidence-event.use-case";
import { generateRecommendationsForUser } from "@/modules/recommendations/application/generate-recommendations.use-case";
import { trackProductEventSafely } from "@/modules/analytics/application/track-product-event-safe";
import { PRODUCT_EVENT_NAME } from "@/modules/analytics/domain/product-event-catalog";
import { requireOnboardedUser } from "@/shared/auth/route-guards";
import { prismaClient } from "@/shared/db/prisma-client";

const EVENT_TYPES = ["TRAINING", "PRACTICE", "ROUTINE", "ACHIEVEMENT", "RECOVERY"] as const;
const INTENSITIES = ["LIGHT", "MODERATE", "INTENSE"] as const;
const TITLE_MIN_LENGTH = 3;
const TITLE_MAX_LENGTH = 160;
const NOTES_MAX_LENGTH = 2000;
const SUCCESS_IMPACT_PREVIEW_LIMIT = 5;
const FIRST_EVIDENCE_LOG_SEQUENCE = 1;
const SECOND_EVIDENCE_LOG_SEQUENCE = 2;

const evidenceSubmissionSchema = z.object({
  title: z.string().min(TITLE_MIN_LENGTH).max(TITLE_MAX_LENGTH),
  notes: z.string().max(NOTES_MAX_LENGTH).optional(),
  eventType: z.enum(EVENT_TYPES),
  intensity: z.enum(INTENSITIES),
  occurredAt: z.string().min(1),
  userAttributeIds: z.array(z.string().min(1)).min(1),
});


function buildValidationErrorState(
  parsed: z.SafeParseError<{
    title: string;
    notes?: string | undefined;
    eventType: "TRAINING" | "PRACTICE" | "ROUTINE" | "ACHIEVEMENT" | "RECOVERY";
    intensity: "LIGHT" | "MODERATE" | "INTENSE";
    occurredAt: string;
    userAttributeIds: string[];
  }>,
): LogEvidenceFormState {
  const fieldErrors: LogEvidenceFormState["fieldErrors"] = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (field === "title") {
      fieldErrors.title = "Provide a concise title (3-160 chars).";
    }
    if (field === "occurredAt") {
      fieldErrors.occurredAt = "Choose when this evidence occurred.";
    }
    if (field === "userAttributeIds") {
      fieldErrors.attributes = "Select at least one affected attribute.";
    }
  }

  return {
    status: "error",
    fieldErrors,
    formError: "Please correct the highlighted fields and submit again.",
  };
}

function invalidDateState(): LogEvidenceFormState {
  return {
    status: "error",
    fieldErrors: {
      occurredAt: "Provide a valid date and time.",
    },
    formError: "Evidence time is invalid.",
  };
}

export async function submitEvidenceEventAction(
  _: LogEvidenceFormState,
  formData: FormData,
): Promise<LogEvidenceFormState> {
  const user = await requireOnboardedUser();

  const titleValue = formData.get("title");
  const eventTypeValue = formData.get("eventType");
  const intensityValue = formData.get("intensity");
  const occurredAtValue = formData.get("occurredAt");
  const notesValue = formData.get("notes");
  const attributeIds = formData.getAll("attributeId");

  const resolvedAttributeIds = attributeIds.flatMap((value) => {
    if (typeof value !== "string" || value.length === 0) {
      return [];
    }
    return [value];
  });

  const parsed = evidenceSubmissionSchema.safeParse({
    title: typeof titleValue === "string" ? titleValue : "",
    notes:
      typeof notesValue === "string" && notesValue.length > 0 ? notesValue : undefined,
    eventType: typeof eventTypeValue === "string" ? eventTypeValue : "",
    intensity: typeof intensityValue === "string" ? intensityValue : "",
    occurredAt: typeof occurredAtValue === "string" ? occurredAtValue : "",
    userAttributeIds: resolvedAttributeIds,
  });

  if (!parsed.success) {
    await trackProductEventSafely({
      eventName: PRODUCT_EVENT_NAME.LOG_SUBMIT_FAILED,
      userId: user.id,
      properties: {
        reason: "validation",
      },
    });
    return buildValidationErrorState(parsed);
  }

  const occurredAt = new Date(parsed.data.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) {
    await trackProductEventSafely({
      eventName: PRODUCT_EVENT_NAME.LOG_SUBMIT_FAILED,
      userId: user.id,
      properties: {
        reason: "invalid_occurred_at",
      },
    });
    return invalidDateState();
  }

  try {
    const result = await createEvidenceEventUseCase({
      userId: user.id,
      title: parsed.data.title,
      notes: parsed.data.notes,
      eventType: parsed.data.eventType,
      intensity: parsed.data.intensity,
      occurredAt,
      userAttributeIds: parsed.data.userAttributeIds,
    });

    await generateRecommendationsForUser({ userId: user.id, now: new Date() });

    const evidenceCount = await prismaClient.evidenceEvent.count({
      where: { userId: user.id },
    });
    const impactedAttributeCount = parsed.data.userAttributeIds.length;
    await trackProductEventSafely({
      eventName: PRODUCT_EVENT_NAME.LOG_SUBMIT_SUCCEEDED,
      userId: user.id,
      properties: {
        eventType: parsed.data.eventType,
        intensity: parsed.data.intensity,
        impactedAttributeCount,
      },
    });
    if (evidenceCount === FIRST_EVIDENCE_LOG_SEQUENCE) {
      await trackProductEventSafely({
        eventName: PRODUCT_EVENT_NAME.FIRST_EVIDENCE_LOG_CREATED,
        userId: user.id,
        properties: {
          eventType: parsed.data.eventType,
          intensity: parsed.data.intensity,
          impactedAttributeCount,
        },
      });
    }
    if (evidenceCount === SECOND_EVIDENCE_LOG_SEQUENCE) {
      await trackProductEventSafely({
        eventName: PRODUCT_EVENT_NAME.SECOND_EVIDENCE_LOG_CREATED,
        userId: user.id,
        properties: {
          eventType: parsed.data.eventType,
          intensity: parsed.data.intensity,
          impactedAttributeCount,
        },
      });
    }

    const persistedEvent = await prismaClient.evidenceEvent.findUnique({
      where: { id: result.eventId },
      include: {
        impacts: {
          include: {
            userAttribute: {
              include: {
                attributeDefinition: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!persistedEvent || persistedEvent.userId !== user.id) {
      return {
        status: "success",
        fieldErrors: {},
        successSummary: {
          title: parsed.data.title,
          eventType: parsed.data.eventType,
          intensity: parsed.data.intensity,
          occurredAt: occurredAt.toLocaleString(),
          impacts: [],
        },
      };
    }

    return {
      status: "success",
      fieldErrors: {},
      successSummary: {
        title: persistedEvent.title,
        eventType: persistedEvent.eventType,
        intensity: persistedEvent.intensity,
        occurredAt: persistedEvent.occurredAt.toLocaleString(),
        impacts: persistedEvent.impacts
          .slice(0, SUCCESS_IMPACT_PREVIEW_LIMIT)
          .map((impact) => ({
            attributeName: impact.userAttribute.attributeDefinition.name,
            deltaCurrent: impact.deltaCurrent.toNumber(),
          })),
      },
    };
  } catch (error: unknown) {
    await trackProductEventSafely({
      eventName: PRODUCT_EVENT_NAME.LOG_SUBMIT_FAILED,
      userId: user.id,
      properties: {
        reason: "server",
      },
    });
    const message = error instanceof Error ? error.message : "Could not record evidence.";
    return {
      status: "error",
      fieldErrors: {},
      formError: message,
    };
  }
}

export async function createEvidenceEventAction(formData: FormData): Promise<void> {
  const result = await submitEvidenceEventAction(INITIAL_LOG_EVIDENCE_FORM_STATE, formData);
  if (result.status !== "success") {
    throw new Error(result.formError ?? "Could not record evidence.");
  }
}
