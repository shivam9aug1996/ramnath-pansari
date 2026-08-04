/**
 * Shop Assist LLM client — calls Next.js /shop-assist/plan (HF Novita behind the proxy).
 * Local agent remains primary; this is fallback only.
 */
import { resolveApiBaseUrl } from "@/config/apiBase";
import type { ConversationContext, ToolCall } from "../types";
import { TOOL_DEFINITIONS } from "../tools/definitions";
import { mapShopAssistPlanToToolCalls } from "./shopAssistPlanMap";
import type { ShopAssistPlanResult } from "./shopAssistPlanSanitize";

export { TOOL_DEFINITIONS, mapShopAssistPlanToToolCalls };
export type { ShopAssistPlanResult as ShopAssistLlmPlan };

export type ShopAssistLlmRequest = {
  userText: string;
  context: ConversationContext;
  authToken?: string | null;
  candidates?: Array<{ i: number; name: string; size?: string | null }>;
};

export type LlmChatRequest = {
  messages: Array<{ role: string; content: string }>;
  context: ConversationContext;
  tools: typeof TOOL_DEFINITIONS;
};

export type LlmChatResponse = {
  content: string | null;
  toolCalls: ToolCall[];
};

const FALLBACK_NONE: ShopAssistPlanResult = {
  action: "none",
  message:
    "Samajh nahi aaya. Product ka naam bolo — jaise Fortune mustard oil.",
};

/** Feature flag — set EXPO_PUBLIC_SHOP_ASSIST_LLM=1 at *build* time to enable HF fallback. */
export function isShopAssistLlmEnabled(): boolean {
  const flag = (process.env.EXPO_PUBLIC_SHOP_ASSIST_LLM ?? "")
    .trim()
    .toLowerCase();
  return flag === "1" || flag === "true";
}

export async function callShopAssistLlm(
  request: ShopAssistLlmRequest,
): Promise<ShopAssistPlanResult> {
  const token = request.authToken;
  if (!token || token === "null") {
    return { ...FALLBACK_NONE };
  }

  try {
    const res = await fetch(`${resolveApiBaseUrl()}/shop-assist/plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userText: request.userText,
        session: {
          language: request.context.language,
          cartItemCount: request.context.cartItemCount,
          pendingProductSelection: request.context.pendingProductSelection,
          pendingQuantity: request.context.pendingQuantity,
          pendingConfirmation: Boolean(request.context.pendingConfirmation),
        },
        candidates: request.candidates ?? [],
      }),
    });

    if (!res.ok) {
      return { ...FALLBACK_NONE };
    }

    const data = (await res.json()) as ShopAssistPlanResult;
    if (!data || typeof data.action !== "string") {
      return { ...FALLBACK_NONE };
    }
    return data;
  } catch {
    return { ...FALLBACK_NONE };
  }
}

/** @deprecated Prefer callShopAssistLlm — kept for older imports. */
export async function callLlmToolLoop(
  _request: LlmChatRequest,
): Promise<LlmChatResponse> {
  throw new Error(
    "Use callShopAssistLlm via conversationManager fallback instead.",
  );
}
