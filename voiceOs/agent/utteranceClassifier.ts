/**
 * Single primary utterance classifier for Shop Assist.
 *
 * Every utterance gets exactly ONE primary category.
 * When multiple predicates match (e.g. "ok" = affirm + historically chatty),
 * CATEGORY_PRECEDENCE decides the winner — never leave it ambiguous.
 */
import type { ConversationContext, ConversationPhase } from "../types";
import { derivePhase } from "../types";
import {
  DENY,
  GREETING_ONLY,
  INDEX_WORDS,
  isAffirm,
  isChitchat,
  isShoppingDecline,
  isShoppingAdvice,
  isShoppingUtterance,
  isSoftNo,
  wantsAddToCart,
  wantsCheckout,
  CART_TOTAL_HINTS,
  CLEAR_CART_HINTS,
  LIST_CART_HINTS,
  OPEN_CART_HINTS,
  MORE_RESULTS_HINTS,
} from "./intentPlanner";
import { isHeldConversation, isSoftEscapeIntent } from "./dialogueHelpers";
import { parseQuantity, parseMultiProductQuery } from "./extractEntities";

export type UtteranceCategory =
  | "EMPTY"
  | "AFFIRM"
  | "DENY"
  | "DECLINE"
  | "GREETING"
  | "CHAT"
  | "SOFT_NO"
  | "QUANTITY"
  | "INDEX"
  | "CHECKOUT"
  | "CART"
  | "SOFT_ESCAPE"
  | "SHOPPING_ADVICE"
  | "SHOPPING"
  | "UNKNOWN";

/**
 * Deterministic primary-category precedence (highest first).
 *
 * Mental model for QA:
 *   AFFIRM > DENY > DECLINE > GREETING > CHAT > … > SHOPPING_ADVICE > SHOPPING > UNKNOWN
 *
 * Example: "ok" matches affirm (and is sometimes chatty) → AFFIRM wins.
 * Example: "later" is DECLINE, never UNKNOWN or SOFT_ESCAPE.
 * Example: "Which oil should I buy?" → SHOPPING_ADVICE (not SHOPPING).
 * Example: "Fortune oil" at confirm → SOFT_ESCAPE (pivot) before bare SHOPPING.
 */
export const CATEGORY_PRECEDENCE: readonly UtteranceCategory[] = [
  "EMPTY",
  "AFFIRM",
  "DENY",
  "DECLINE",
  "GREETING",
  "CHAT",
  "SOFT_NO",
  "QUANTITY",
  "INDEX",
  "CHECKOUT",
  "CART",
  "SOFT_ESCAPE",
  "SHOPPING_ADVICE",
  "SHOPPING",
  "UNKNOWN",
] as const;

export type UtteranceClassification = {
  category: UtteranceCategory;
  subtype: string;
  confidence: number;
  /** Parallel flags — for diagnosing overlaps; primary = category only. */
  flags: {
    greeting: boolean;
    chitchat: boolean;
    held: boolean;
    decline: boolean;
    softNo: boolean;
    affirm: boolean;
    deny: boolean;
    softEscape: boolean;
    quantity: boolean;
    index: boolean;
    shopping: boolean;
    shoppingAdvice: boolean;
    checkout: boolean;
  };
};

export type TurnDecisionDebug = {
  input: string;
  classification: UtteranceClassification;
  phaseBefore: ConversationPhase;
  decision: string;
  toolNames: string[];
};

function subtypeForChat(text: string): string {
  const t = text.trim().toLowerCase();
  if (/thanks?|thank\s+you|shukriya|dhanyavaad/i.test(t)) return "THANKS";
  if (/bye|goodbye|good\s+night|see\s+you|phir\s+milte/i.test(t)) return "BYE";
  if (/who\s+are\s+you|kaun\s+ho|what\s+can\s+you|madad|help/i.test(t)) {
    return "IDENTITY_OR_HELP";
  }
  if (
    /fine|good|well|great|alright|sab\s+theek|all\s+good/i.test(t) &&
    !/how\s+are\s+you|kaise\s+ho|are\s+you/i.test(t)
  ) {
    return "WELLBEING_REPLY";
  }
  if (/how'?s\s+your\s+day|how\s+is\s+your\s+day/i.test(t)) return "DAY_GOING";
  if (/how\s+are\s+you|kaise\s+ho|are\s+you\s+.*ok|kya\s+haal/i.test(t)) {
    return "WELLBEING_ASK";
  }
  return "SMALLTALK";
}

function subtypeForDecline(text: string): string {
  const t = text.trim().toLowerCase();
  if (/later|baad|phir\s+kabhi|another\s+time|not\s+now|abhi\s+nahi/i.test(t)) {
    return "NOT_NOW";
  }
  if (/don'?t\s+(need|want)|nothing|kuch\s+nahi|no\s+need|not\s+interested/i.test(t)) {
    return "NOTHING";
  }
  return "DECLINE";
}

function decisionLabel(
  classification: UtteranceClassification,
  phase: ConversationPhase,
): string {
  const writeGated =
    phase === "awaiting_confirmation" || phase === "awaiting_qty";
  switch (classification.category) {
    case "AFFIRM":
      return writeGated ? "Confirm / proceed write gate" : "Affirm (no write gate)";
    case "DENY":
    case "DECLINE":
      return writeGated ? "Cancel write gate" : "Polite decline / cancel";
    case "GREETING":
    case "CHAT":
      return writeGated ? "Hold conversation — resume shopping gate" : "Conversation only";
    case "SOFT_ESCAPE":
      return "Soft-escape — clear write gate, pivot to new intent";
    case "SHOPPING_ADVICE":
      return writeGated
        ? "Advice — hold write gate, then resume"
        : "Shopping advice — recommend first, search on follow-up";
    case "SHOPPING":
      return "Plan catalog search";
    case "QUANTITY":
      return "Accept quantity";
    case "INDEX":
      return "Product / option pick";
    case "CHECKOUT":
      return "Start checkout";
    case "CART":
      return "Cart operation";
    case "SOFT_NO":
      return "Short no (contextual)";
    case "UNKNOWN":
      return writeGated
        ? "Clarify — keep write gate (no search, no clear)"
        : "Clarify — no search";
    case "EMPTY":
      return "Ask for input";
    default:
      return "Unhandled";
  }
}

/**
 * Classify a user utterance into exactly one primary category.
 * Precedence: see CATEGORY_PRECEDENCE.
 */
export function classifyUtterance(
  text: string,
  context?: ConversationContext,
): UtteranceClassification {
  const raw = text.trim();
  const ctx = context ?? ({ lastSearchQuery: null } as ConversationContext);

  const writeGated = !!(
    ctx.pendingConfirmation ||
    (ctx.pendingQuantity && ctx.selectedProduct)
  );

  const flags = {
    greeting: GREETING_ONLY.test(raw),
    chitchat: isChitchat(raw),
    held: isHeldConversation(raw),
    decline: isShoppingDecline(raw),
    softNo: isSoftNo(raw),
    affirm: isAffirm(raw),
    deny: DENY.test(raw),
    softEscape: writeGated && isSoftEscapeIntent(raw, ctx),
    quantity: parseQuantity(raw) != null,
    index: Object.prototype.hasOwnProperty.call(
      INDEX_WORDS,
      raw.toLowerCase().replace(/[?!.,]+$/g, ""),
    ),
    shopping: false,
    shoppingAdvice: isShoppingAdvice(raw),
    checkout: wantsCheckout(raw),
  };

  const parsed = parseMultiProductQuery(raw);
  const kw = parsed?.keywords?.join(" ").trim() ?? "";
  flags.shopping = isShoppingUtterance(raw, {
    keyword: kw || null,
    intentAdd: wantsAddToCart(raw),
  });

  // --- precedence ladder (must stay in sync with CATEGORY_PRECEDENCE) ---
  if (!raw) {
    return { category: "EMPTY", subtype: "EMPTY", confidence: 1, flags };
  }
  if (flags.affirm) {
    return { category: "AFFIRM", subtype: "CONFIRM", confidence: 0.98, flags };
  }
  if (flags.deny) {
    return { category: "DENY", subtype: "CANCEL", confidence: 0.95, flags };
  }
  if (flags.decline) {
    return {
      category: "DECLINE",
      subtype: subtypeForDecline(raw),
      confidence: 0.95,
      flags,
    };
  }
  if (flags.greeting) {
    return { category: "GREETING", subtype: "HELLO", confidence: 0.99, flags };
  }
  if (flags.chitchat || flags.held) {
    return {
      category: "CHAT",
      subtype: subtypeForChat(raw),
      confidence: 0.96,
      flags,
    };
  }
  if (flags.softNo) {
    return { category: "SOFT_NO", subtype: "SHORT_NO", confidence: 0.9, flags };
  }
  if (flags.quantity) {
    return { category: "QUANTITY", subtype: "NUMBER", confidence: 0.97, flags };
  }
  if (flags.index) {
    return { category: "INDEX", subtype: "PICK", confidence: 0.97, flags };
  }
  if (flags.checkout) {
    return {
      category: "CHECKOUT",
      subtype: "PROCEED",
      confidence: 0.93,
      flags,
    };
  }
  if (
    LIST_CART_HINTS.test(raw) ||
    OPEN_CART_HINTS.test(raw) ||
    CART_TOTAL_HINTS.test(raw) ||
    CLEAR_CART_HINTS.test(raw) ||
    (MORE_RESULTS_HINTS.test(raw) && !!ctx.lastSearchQuery)
  ) {
    return { category: "CART", subtype: "CART_OP", confidence: 0.9, flags };
  }
  if (flags.softEscape) {
    return {
      category: "SOFT_ESCAPE",
      subtype: "PIVOT",
      confidence: 0.85,
      flags,
    };
  }
  if (flags.shoppingAdvice) {
    return {
      category: "SHOPPING_ADVICE",
      subtype: "RECOMMEND",
      confidence: 0.92,
      flags,
    };
  }
  if (flags.shopping) {
    return {
      category: "SHOPPING",
      subtype: wantsAddToCart(raw) ? "ADD_SEARCH" : "SEARCH",
      confidence: 0.9,
      flags,
    };
  }
  return { category: "UNKNOWN", subtype: "UNCLEAR", confidence: 0.35, flags };
}

/** Human-readable turn decision for __DEV__ / debug builds. */
export function formatTurnDecisionDebug(info: TurnDecisionDebug): string {
  const { classification: c } = info;
  return [
    "──────────────────────────────",
    `Input: ${info.input}`,
    `Category: ${c.category}`,
    `Subtype: ${c.subtype}`,
    `Confidence: ${c.confidence}`,
    `Current Phase: ${info.phaseBefore}`,
    `Decision: ${info.decision}`,
    `Tool Calls: ${info.toolNames.length ? info.toolNames.join(", ") : "None"}`,
    "──────────────────────────────",
  ].join("\n");
}

export function buildTurnDecisionDebug(
  userText: string,
  session: ConversationContext,
  toolNames: string[],
): TurnDecisionDebug {
  const classification = classifyUtterance(userText, session);
  const phaseBefore = derivePhase(session);
  return {
    input: userText.trim(),
    classification,
    phaseBefore,
    decision: decisionLabel(classification, phaseBefore),
    toolNames,
  };
}

function readDebugFlag(): boolean {
  try {
    if (typeof __DEV__ !== "undefined" && __DEV__) return true;
  } catch {
    /* ignore */
  }
  try {
    // Static access so Expo can inline EXPO_PUBLIC_* at build time
    const flag = process.env.EXPO_PUBLIC_SHOP_ASSIST_DEBUG;
    return flag === "1" || flag === "true";
  } catch {
    return false;
  }
}

/** Log classifier decision in debug builds (no-op in tests / production). */
export function logTurnDecisionDebug(info: TurnDecisionDebug): void {
  if (process.env.NODE_ENV === "test") return;
  if (!readDebugFlag()) return;
  console.log(`[shop-assist:decision]\n${formatTurnDecisionDebug(info)}`);
}
