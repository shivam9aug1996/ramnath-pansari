import type { ConversationContext, ConversationPhase } from "../types";
import { derivePhase as derivePhaseFromFlags } from "../types";

export type { ConversationPhase } from "../types";
export { derivePhaseFromFlags as derivePhase };

/** Gates where LLM must not override local confirm/qty/multi-buy. */
export function isWriteGatedPhase(phase: ConversationPhase): boolean {
  return (
    phase === "awaiting_confirmation" ||
    phase === "awaiting_qty" ||
    phase === "awaiting_multi_product_confirm"
  );
}

/**
 * Merge a context patch and always set `phase` from the resulting flag bag.
 */
export function syncPhaseIntoPatch(
  base: ConversationContext,
  patch: Partial<ConversationContext>,
): Partial<ConversationContext> {
  const merged = { ...base, ...patch };
  return { ...patch, phase: derivePhaseFromFlags(merged) };
}

export function getPhase(ctx: ConversationContext): ConversationPhase {
  return ctx.phase ?? derivePhaseFromFlags(ctx);
}
