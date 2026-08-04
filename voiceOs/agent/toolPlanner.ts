import { nanoid } from "@reduxjs/toolkit";
import type { ConversationContext } from "../types";
import type { PlanTurnResult } from "./dialogueManager";
import { preferHi, languagePatch } from "./language";
import {
  parseMultiProductQuery,
  parseSizeHint,
  parseAddQuantity,
  preferSizeForKeyword,
  keywordLooksSizeful,
  isBrandOnlyKeyword,
} from "./extractEntities";
import { isShoppingUtterance, wantsAddToCart } from "./intentPlanner";
import {
  CONFIDENCE_CLARIFY_THRESHOLD,
  isGroceryishKeyword,
  scoreSearchConfidence,
} from "./confidence";
import { buildBroadCategoryClarifyTurn } from "./broadCategories";
import { clearChoiceAwaitingState } from "./dialogueHelpers";

function uncertainClarify(
  hi: boolean,
  langPatch: Partial<ConversationContext>,
  confidence: number,
): PlanTurnResult {
  return {
    toolCalls: [],
    earlyResult: {
      assistantMessage: hi
        ? "Samajh nahi aaya. Product ka naam bolo — jaise Fortune mustard oil."
        : "I didn't catch that. Try a product name like Fortune mustard oil.",
      toolCalls: [],
      toolResults: [],
      contextPatch: { ...langPatch },
      uiAction: null,
    },
    sessionPatch: {},
    intent: "clarify",
    confidence,
  };
}

/**
 * Shopping planner — only emits searchProducts when local shopping intent is clear.
 * Conversation / ambiguous leftovers return clarify (LLM may classify next).
 */
export function planToolsFromUtterance(
  userText: string,
  context: ConversationContext,
): PlanTurnResult {
  const text = userText.trim();
  const hi = preferHi(context.language, userText);
  const langPatch = languagePatch(context, userText);

  const parsed = parseMultiProductQuery(text);
  if (!parsed || parsed.keywords.length === 0) {
    return uncertainClarify(hi, langPatch, 0.2);
  }

  // No and/aur — ambiguous list → ask before searching
  if (parsed.needsConfirm && parsed.keywords.length >= 2) {
    const lines = parsed.keywords
      .map((p, i) => `${i + 1}. ${p}`)
      .join("\n");
    return {
      toolCalls: [],
      earlyResult: {
        assistantMessage: hi
          ? `Lagta hai aap ${parsed.keywords.length} products chahte ho:\n${lines}\nSahi hai?\n"Haan" = inhein alag-alag search karunga.\n"Nahi" = ek hi product samajh ke search: "${parsed.fullPhrase}"`
          : `Looks like ${parsed.keywords.length} products:\n${lines}\nIs that right?\n"Yes" = search them one by one.\n"No" = search as one: "${parsed.fullPhrase}"`,
        toolCalls: [],
        toolResults: [],
        contextPatch: {
          ...langPatch,
          pendingMultiProductConfirm: {
            products: parsed.keywords,
            fullPhrase: parsed.fullPhrase,
          },
          pendingConfirmation: null,
          pendingProductSelection: false,
          pendingQuantity: false,
        },
        uiAction: null,
      },
      sessionPatch: {},
      intent: "clarify",
      confidence: 0.6,
    };
  }

  const [keyword, ...searchRest] = parsed.keywords;
  const sizeHint = parseSizeHint(text);
  const addIntent = wantsAddToCart(text);
  const addQty = addIntent ? parseAddQuantity(text) : null;
  const preferSize = preferSizeForKeyword(keyword, sizeHint, parsed.keywords);
  const queuePreferSize =
    sizeHint && searchRest.some((k) => keywordLooksSizeful(k)) ? sizeHint : null;

  const groceryish = isGroceryishKeyword(keyword);
  const shopping = isShoppingUtterance(text, {
    keyword,
    preferSize,
    intentAdd: addIntent,
  });

  // Pipeline rule: no clear shopping signal → never hit catalog
  if (!shopping) {
    return uncertainClarify(hi, langPatch, 0.35);
  }

  // Brand-only (e.g. "Fortune") — ask category instead of dumping loose matches
  if (isBrandOnlyKeyword(keyword) && !preferSize && searchRest.length === 0) {
    const brand =
      keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase();
    return {
      toolCalls: [],
      earlyResult: {
        assistantMessage: hi
          ? `${brand} ke kaafi products hain. Aapko ${brand} oil, atta, besan, rice ya kuch aur chahiye? Category bolo.`
          : `${brand} has many products. Do you want ${brand} oil, atta, besan, rice, or something else? Tell me the category.`,
        toolCalls: [],
        toolResults: [],
        contextPatch: {
          ...langPatch,
          ...clearChoiceAwaitingState(),
          lastAssistantPromptType: "shopping_prompt",
          pendingBrand: keyword.toLowerCase(),
        },
        uiAction: null,
      },
      sessionPatch: {},
      intent: "clarify",
      confidence: 0.7,
    };
  }

  // Very broad single-token categories → clarify before dumping 90+ results
  if (!preferSize && !addIntent && searchRest.length === 0) {
    const broadTurn = buildBroadCategoryClarifyTurn(keyword, hi, langPatch);
    if (broadTurn) return broadTurn;
  }

  const confidence = scoreSearchConfidence({
    keyword,
    preferSize,
    intentAdd: addIntent,
    groceryish,
  });

  if (
    confidence < CONFIDENCE_CLARIFY_THRESHOLD &&
    !addIntent &&
    !preferSize &&
    !groceryish
  ) {
    return uncertainClarify(hi, langPatch, confidence);
  }

  return {
    toolCalls: [
      {
        id: nanoid(),
        name: "searchProducts",
        args: {
          keyword,
          limit: preferSize ? 12 : 8,
          ...(searchRest.length > 0 ? { searchQueue: searchRest } : {}),
          ...(addIntent ? { intent: "add" } : {}),
          ...(preferSize ? { preferSize } : {}),
          ...(addIntent ? { preferQty: addQty ?? 1 } : {}),
        },
      },
    ],
    ...(queuePreferSize
      ? { sessionPatch: { pendingSearchPreferSize: queuePreferSize } }
      : {}),
    intent: addIntent ? "buy" : "search",
    confidence,
  };
}
