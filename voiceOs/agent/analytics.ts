import type { TurnAnalyticsEvent } from "../types";

/** Emit one structured analytics event per Shop Assist turn. */
export function emitTurnAnalytics(event: TurnAnalyticsEvent): void {
  if (process.env.NODE_ENV === "test") return;
  console.log(`[shop-assist:analytics] ${JSON.stringify(event)}`);
}
