import type {
  ProductEventName,
  TrackProductEventInput,
} from "@/modules/analytics/domain/product-event-catalog";
import { trackProductEventUseCase } from "@/modules/analytics/application/track-product-event.use-case";

export async function trackProductEventSafely<TEventName extends ProductEventName>(
  input: TrackProductEventInput<TEventName>,
): Promise<void> {
  try {
    await trackProductEventUseCase(input);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown analytics error";
    console.error("[hexis.analytics] track_failed", {
      eventName: input.eventName,
      userId: input.userId,
      message,
    });
  }
}
