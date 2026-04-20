import type { Prisma } from "@prisma/client";
import { prismaClient } from "@/shared/db/prisma-client";
import type {
  ProductEventName,
  TrackProductEventInput,
} from "@/modules/analytics/domain/product-event-catalog";

export async function trackProductEventUseCase<TEventName extends ProductEventName>(
  input: TrackProductEventInput<TEventName>,
): Promise<void> {
  const properties = input.properties as Prisma.InputJsonValue;
  const userField =
    input.userId === undefined ? {} : { userId: input.userId };

  await prismaClient.productAnalyticsEvent.create({
    data: {
      eventName: input.eventName,
      ...userField,
      properties,
      occurredAt: input.occurredAt ?? new Date(),
    },
  });
}
