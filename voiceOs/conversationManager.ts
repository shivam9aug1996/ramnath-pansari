import { nanoid } from "@reduxjs/toolkit";
import type store from "@/redux/store";
import { executeTool, type ToolExecutorContext } from "./toolExecutor";
import { buildResponseAfterTools, planTurn } from "./agent/localAgent";
import {
  callShopAssistLlm,
  isShopAssistLlmEnabled,
} from "./agent/llmClient";
import { mapShopAssistPlanToToolCalls } from "./agent/shopAssistPlanMap";
import { getPhase, isWriteGatedPhase, syncPhaseIntoPatch } from "./agent/phase";
import { detectShopIntent } from "./agent/intentPlanner";
import { emitTurnAnalytics } from "./agent/analytics";
import {
  buildTurnDecisionDebug,
  logTurnDecisionDebug,
} from "./agent/utteranceClassifier";
import type {
  AgentTurnResult,
  ConversationContext,
  ToolCall,
  ToolResult,
  TurnPlan,
  ShopIntent,
} from "./types";

export type ConversationManagerDeps = {
  dispatch: typeof store.dispatch;
  getState: typeof store.getState;
};

function mergeContext(
  base: ConversationContext,
  patch: Partial<ConversationContext>,
): ConversationContext {
  const merged = { ...base, ...patch };
  // Always sync phase
  const withPhase = syncPhaseIntoPatch(base, patch);
  return { ...merged, ...withPhase };
}

function preferSizeForQueuedKeyword(
  keyword: string,
  sizeHint: string | null | undefined,
): string | null {
  if (!sizeHint) return null;
  if (
    !/\b(oil|tel|atta|aata|milk|doodh|ghee|flour|sarso|sarson|mustard|sunflower|groundnut|coconut)\b/i.test(
      keyword,
    )
  ) {
    return null;
  }
  return sizeHint;
}

function isUnclearLocalTurn(
  early: AgentTurnResult | undefined,
  toolCalls: ToolCall[],
): boolean {
  if (toolCalls.length > 0) return false;
  if (!early?.assistantMessage) return false;
  return /Samajh nahi aaya|didn't catch that/i.test(early.assistantMessage);
}

/**
 * Grocery-ish signal — if missing, a bare searchProducts is weak and LLM
 * should classify (chitchat vs product) before we hit the catalog.
 */
const GROCERYISH =
  /\b(oil|tel|atta|aata|flour|sugar|chini|dal|rice|chawal|milk|doodh|ghee|salt|namak|tea|chai|honey|shahad|soap|detergent|biscuit|namkeen|masala|spice|wheat|mustard|sarso|sarson|sunflower|coconut|nariyal|toor|arhar|moong|chana|besan|maida|poha|noodles?|pasta|juice|butter|curd|dahi|paneer|eggs?|ande?|bread|pav|ketchup|sauce|pickle|achar|haldi|jeera|mirch|turmeric|cumin|basmati|fortune|patanjali|aashirvaad|tata|dabur|amul|saffola|parle|maggi|nestle|india\s*gate|mother\s*dairy|good\s*life|zandu)\b/i;

/**
 * Local defaulted to search without add/size/queue and no grocery lexicon —
 * classic "what are you doing?" → false-positive product search.
 */
export function isWeakDefaultSearch(toolCalls: ToolCall[]): boolean {
  if (toolCalls.length !== 1) return false;
  const call = toolCalls[0];
  if (call.name !== "searchProducts") return false;
  const args = call.args ?? {};
  if (args.intent === "add") return false;
  if (typeof args.preferSize === "string" && args.preferSize.trim()) return false;
  if (Array.isArray(args.searchQueue) && args.searchQueue.length > 0) {
    return false;
  }
  const keyword = String(args.keyword ?? "");
  return !GROCERYISH.test(keyword);
}

function authTokenFromState(getState: ConversationManagerDeps["getState"]): string | null {
  try {
    const state = getState() as { auth?: { token?: string | null } };
    const token = state?.auth?.token;
    if (!token || token === "null") return null;
    return token;
  } catch {
    return null;
  }
}

/**
 * Layer 2 — every user message flows through here.
 * Plans tools (local agent / optional HF fallback) → Tool Executor → response + UI handoff.
 */
export async function handleUserMessage(
  userText: string,
  session: ConversationContext,
  deps: ConversationManagerDeps,
): Promise<AgentTurnResult> {
  const startTime = Date.now();
  const phaseBefore = getPhase(session);
  
  let planned = planTurn(userText, session);
  let toolCalls: ToolCall[] = planned.toolCalls;
  let early = planned.earlyResult;
  let sessionPatch = planned.sessionPatch ?? {};
  let notePrefix = planned.notePrefix?.trim();
  let llmUsed = false;
  let fallbackReason: string | null = null;

  logTurnDecisionDebug(
    buildTurnDecisionDebug(
      userText,
      session,
      toolCalls.map((t) => t.name),
    ),
  );

  // LLM when local is unsure — never after a confident shopping plan.
  // Triggers: unclear copy, weak search (safety), or low-confidence clarify.
  const weakSearch = isWeakDefaultSearch(toolCalls);
  const phase = getPhase(session);
  const lowConfidenceClarify =
    toolCalls.length === 0 &&
    (planned.turnPlan?.confidence ?? 1) < 0.5 &&
    planned.turnPlan?.intent === "clarify";
  if (
    isShopAssistLlmEnabled() &&
    (isUnclearLocalTurn(early, toolCalls) ||
      weakSearch ||
      lowConfidenceClarify) &&
    !isWriteGatedPhase(phase)
  ) {
    llmUsed = true;
    fallbackReason = isUnclearLocalTurn(early, toolCalls)
      ? "unclear_local"
      : weakSearch
        ? "weak_search"
        : "uncertain_non_shopping";
    const candidates = session.pendingProductSelection
      ? session.lastSearchProducts.slice(0, 12).map((p, i) => ({
          i: i + 1,
          name: p.name,
          size: p.size ?? null,
        }))
      : [];

    const llmPlan = await callShopAssistLlm({
      userText,
      context: session,
      authToken: authTokenFromState(deps.getState),
      candidates,
    });

    if (llmPlan.action === "pick" && session.pendingProductSelection) {
      const pickText =
        typeof llmPlan.index === "number" ? String(llmPlan.index) : userText;
      planned = planTurn(pickText, session);
      toolCalls = planned.toolCalls;
      early = planned.earlyResult;
      sessionPatch = { ...sessionPatch, ...planned.sessionPatch };
      notePrefix = planned.notePrefix?.trim() ?? notePrefix;
    } else {
      const mapped = mapShopAssistPlanToToolCalls(llmPlan);
      if (mapped.toolCalls.length > 0) {
        toolCalls = mapped.toolCalls;
        early = undefined;
      } else if (mapped.assistantMessage) {
        const finalPatch = syncPhaseIntoPatch(session, sessionPatch);
        const phaseAfter = getPhase({ ...session, ...finalPatch });
        const intent = detectShopIntent(userText, session);
        const turnPlan: TurnPlan = {
          intent,
          tools: [],
          phaseAfter,
          fallbackReason,
          clarify: mapped.assistantMessage,
        };
        emitTurnAnalytics({
          intent,
          phaseBefore,
          phaseAfter,
          llmUsed,
          fallbackReason,
          toolNames: [],
          latencyMs: Date.now() - startTime,
          success: true,
        });
        return {
          assistantMessage: notePrefix
            ? `${notePrefix}\n${mapped.assistantMessage}`
            : mapped.assistantMessage,
          toolCalls: [],
          toolResults: [],
          contextPatch: finalPatch,
          uiAction: null,
          turnPlan,
        };
      } else if (weakSearch || lowConfidenceClarify) {
        const msg =
          "Product ka naam bolo — jaise Fortune mustard oil.";
        const finalPatch = syncPhaseIntoPatch(session, sessionPatch);
        const phaseAfter = getPhase({ ...session, ...finalPatch });
        const turnPlan: TurnPlan = {
          intent: "clarify",
          tools: [],
          phaseAfter,
          fallbackReason,
          clarify: msg,
        };
        emitTurnAnalytics({
          intent: "clarify",
          phaseBefore,
          phaseAfter,
          llmUsed,
          fallbackReason,
          toolNames: [],
          latencyMs: Date.now() - startTime,
          success: true,
        });
        return {
          assistantMessage: notePrefix ? `${notePrefix}\n${msg}` : msg,
          toolCalls: [],
          toolResults: [],
          contextPatch: finalPatch,
          uiAction: null,
          turnPlan,
        };
      }
    }
  }

  if (early && toolCalls.length === 0) {
    const finalPatch = syncPhaseIntoPatch(session, { ...sessionPatch, ...early.contextPatch });
    const phaseAfter = getPhase({ ...session, ...finalPatch });
    const intent = detectShopIntent(userText, session);
    
    emitTurnAnalytics({
      intent,
      phaseBefore,
      phaseAfter,
      llmUsed,
      fallbackReason,
      toolNames: [],
      latencyMs: Date.now() - startTime,
      success: true,
    });
    
    const turnPlan: TurnPlan = {
      intent: early.turnPlan?.intent ?? intent,
      confidence: early.turnPlan?.confidence,
      tools: [],
      phaseAfter,
      fallbackReason,
      clarify: early.assistantMessage,
    };
    
    return {
      ...early,
      contextPatch: finalPatch,
      assistantMessage: notePrefix
        ? `${notePrefix}\n${early.assistantMessage}`
        : early.assistantMessage,
      turnPlan,
    };
  }

  const activeSession = mergeContext(session, sessionPatch);

  // Checkout via LLM when not logged in → OPEN_LOGIN (mirror local agent)
  if (
    toolCalls.length === 1 &&
    toolCalls[0].name === "startCheckout" &&
    !activeSession.customerId
  ) {
    toolCalls = [
      {
        id: nanoid(),
        name: "openUi",
        args: { action: "OPEN_LOGIN" },
      },
    ];
  }

  const ctx: ToolExecutorContext = {
    dispatch: deps.dispatch,
    getState: deps.getState,
    session: activeSession,
  };

  const toolResults: ToolResult[] = [];
  for (const call of toolCalls) {
    toolResults.push(await executeTool(call.name, call.args, ctx));
  }

  let result = buildResponseAfterTools({
    userText,
    context: activeSession,
    toolCalls,
    toolResults,
  });

  const finalPatch = syncPhaseIntoPatch(activeSession, { ...sessionPatch, ...result.contextPatch });
  result = {
    ...result,
    contextPatch: finalPatch,
    assistantMessage: notePrefix
      ? `${notePrefix}\n${result.assistantMessage}`
      : result.assistantMessage,
  };

  // After successful add OR empty search in a multi-buy queue → auto next search
  const justAdded = result.toolResults.some(
    (r) => r.toolName === "addToCart" && r.ok,
  );
  const emptySearch = result.toolResults.some((r) => {
    if (r.toolName !== "searchProducts" || !r.ok) return false;
    const count = (r.data as { count?: number } | undefined)?.count;
    return count === 0;
  });
  if (
    (justAdded || emptySearch) &&
    result.contextPatch.pendingTool === "continueSearchQueue" &&
    (result.contextPatch.pendingSearchQueue?.length ?? 0) > 0
  ) {
    const queue = result.contextPatch.pendingSearchQueue ?? [];
    const [keyword, ...rest] = queue;
    const sizeHint = preferSizeForQueuedKeyword(
      keyword,
      result.contextPatch.pendingSearchPreferSize ??
        activeSession.pendingSearchPreferSize,
    );
    const merged = mergeContext(activeSession, {
      ...result.contextPatch,
      pendingSearchQueue: rest,
      pendingTool: null,
      pendingSearchPreferSize:
        rest.length > 0
          ? (result.contextPatch.pendingSearchPreferSize ??
            activeSession.pendingSearchPreferSize)
          : null,
    });
    const call: ToolCall = {
      id: nanoid(),
      name: "searchProducts",
      args: {
        keyword,
        limit: sizeHint ? 12 : 8,
        ...(rest.length > 0 ? { searchQueue: rest } : {}),
        ...(sizeHint ? { preferSize: sizeHint } : {}),
      },
    };
    const nextCtx: ToolExecutorContext = { ...ctx, session: merged };
    const tr = await executeTool(call.name, call.args, nextCtx);
    const next = buildResponseAfterTools({
      userText: keyword,
      context: merged,
      toolCalls: [call],
      toolResults: [tr],
    });
    result = {
      ...next,
      assistantMessage: `${result.assistantMessage}\n\n${next.assistantMessage}`,
      toolCalls: [...result.toolCalls, ...next.toolCalls],
      toolResults: [...result.toolResults, ...next.toolResults],
      contextPatch: {
        ...sessionPatch,
        ...next.contextPatch,
        cartItemCount:
          next.contextPatch.cartItemCount ?? result.contextPatch.cartItemCount,
        cartItems: next.contextPatch.cartItems ?? result.contextPatch.cartItems,
      },
      products: next.products ?? result.products,
      uiAction: next.uiAction ?? result.uiAction,
    };
  }

  // Build TurnPlan and emit analytics
  const phaseAfter = getPhase({ ...activeSession, ...result.contextPatch });
  const intent = detectShopIntent(userText, session);
  const success = !result.toolResults.some((r) => !r.ok);
  
  const turnPlan: TurnPlan = {
    intent: planned.turnPlan?.intent ?? intent,
    confidence: planned.turnPlan?.confidence,
    tools: toolCalls,
    phaseAfter,
    fallbackReason,
  };
  
  emitTurnAnalytics({
    intent: turnPlan.intent,
    phaseBefore,
    phaseAfter,
    llmUsed,
    fallbackReason,
    toolNames: toolCalls.map((c) => c.name),
    latencyMs: Date.now() - startTime,
    success,
    confidence: turnPlan.confidence ?? null,
  });

  return {
    ...result,
    turnPlan,
  };
}
