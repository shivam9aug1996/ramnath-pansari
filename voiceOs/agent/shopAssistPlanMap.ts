import { nanoid } from "@reduxjs/toolkit";
import type { ToolCall } from "../types";
import type { ShopAssistPlanResult } from "./shopAssistPlanSanitize";

const FALLBACK_MSG =
  "Samajh nahi aaya. Product ka naam bolo — jaise Fortune mustard oil.";

/**
 * Map LLM plan → tool calls (never emits addToCart — confirm gate stays local).
 */
export function mapShopAssistPlanToToolCalls(
  plan: ShopAssistPlanResult,
): { toolCalls: ToolCall[]; assistantMessage: string | null } {
  switch (plan.action) {
    case "search": {
      if (!plan.keyword?.trim()) {
        return {
          toolCalls: [],
          assistantMessage: plan.message ?? FALLBACK_MSG,
        };
      }
      const preferQty =
        typeof plan.preferQty === "number" && plan.preferQty >= 1
          ? Math.min(plan.preferQty, 5)
          : null;
      return {
        toolCalls: [
          {
            id: nanoid(),
            name: "searchProducts",
            args: {
              keyword: plan.keyword.trim(),
              limit: plan.preferSize ? 12 : 8,
              ...(plan.preferSize ? { preferSize: plan.preferSize } : {}),
              ...(preferQty ? { intent: "add", preferQty } : {}),
            },
          },
        ],
        assistantMessage: null,
      };
    }
    case "checkout":
      return {
        toolCalls: [{ id: nanoid(), name: "startCheckout", args: {} }],
        assistantMessage: null,
      };
    case "cart_list":
      return {
        toolCalls: [
          { id: nanoid(), name: "getCart", args: { mode: "list" } },
        ],
        assistantMessage: null,
      };
    case "ask":
      return {
        toolCalls: [],
        assistantMessage:
          plan.message?.trim() ||
          "Thoda clear bolo — kaunsa product chahiye?",
      };
    case "pick":
      return { toolCalls: [], assistantMessage: null };
    case "none":
    default:
      return {
        toolCalls: [],
        assistantMessage: plan.message?.trim() || FALLBACK_MSG,
      };
  }
}
