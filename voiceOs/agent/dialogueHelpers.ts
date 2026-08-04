import type {
  AgentTurnResult,
  ConfirmationPayload,
  ConversationContext,
  SessionProduct,
} from "../types";
import { DEFAULT_MAX_CART_QTY } from "../types";
import {
  GREETING_ONLY,
  INDEX_WORDS,
  isAffirm,
  isChitchat,
  isShoppingDecline,
  isShoppingUtterance,
  normalizeChitchatText,
  wantsCheckout,
  LIST_CART_HINTS,
  OPEN_CART_HINTS,
  CART_TOTAL_HINTS,
  CLEAR_CART_HINTS,
  MORE_RESULTS_HINTS,
  DENY,
} from "./intentPlanner";
import { parseQuantity, parseMultiProductQuery } from "./extractEntities";
import { preferHi } from "./language";

export function matchPendingProduct(
  text: string,
  products: SessionProduct[],
): SessionProduct[] {
  const lower = text.trim().toLowerCase();
  const indexHit = INDEX_WORDS[lower];
  if (typeof indexHit === "number") {
    const idx = indexHit === -1 ? products.length - 1 : indexHit;
    if (products[idx]) return [products[idx]];
  }

  const num = lower.match(/^(\d+)\s*(st|nd|rd|th|number|no\.?)?$/i);
  if (num) {
    const idx = Number(num[1]) - 1;
    if (products[idx]) return [products[idx]];
  }

  const bySize = products.filter((p) => {
    const size = (p.size ?? "").toLowerCase();
    return size && lower.includes(size.toLowerCase());
  });
  if (bySize.length === 1) return bySize;

  const byName = products.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      lower
        .split(/\s+/)
        .every((w) => w.length < 2 || p.name.toLowerCase().includes(w)),
  );
  if (byName.length > 0) return byName;

  return [];
}

export function formatProductLine(p: SessionProduct, index: number): string {
  const size = p.size ? ` (${p.size})` : "";
  const price =
    p.discountedPrice != null
      ? ` — ₹${p.discountedPrice}`
      : p.price != null
        ? ` — ₹${p.price}`
        : "";
  const stock = p.isOutOfStock ? " [out of stock]" : "";
  return `${index + 1}. ${p.name}${size}${price}${stock}`;
}

export function maxQtyFor(product: SessionProduct): number {
  const m = product.maxQuantity;
  if (typeof m === "number" && m > 0) return Math.min(m, DEFAULT_MAX_CART_QTY);
  return DEFAULT_MAX_CART_QTY;
}

export function askQuantityResult(
  product: SessionProduct,
  hi: boolean,
  queue: SessionProduct[] = [],
  preferQty: number | null = null,
): AgentTurnResult {
  if (product.isOutOfStock) {
    return {
      assistantMessage: hi
        ? `${product.name} abhi out of stock hai. Koi aur option choose karo.`
        : `${product.name} is out of stock. Pick another option.`,
      toolCalls: [],
      toolResults: [],
      contextPatch: {
        pendingProductSelection: true,
        selectedProduct: null,
        pendingQuantity: false,
        pendingConfirmation: null,
        pendingProductQueue: queue,
      },
      uiAction: null,
      products: undefined,
    };
  }

  if (preferQty != null && preferQty >= 1) {
    const qty = Math.min(preferQty, maxQtyFor(product));
    const confirmed = buildAddConfirmation(product, qty, hi);
    return {
      ...confirmed,
      contextPatch: {
        ...confirmed.contextPatch,
        pendingAddQuantity: null,
        pendingProductQueue: queue,
      },
    };
  }

  const maxQ = maxQtyFor(product);
  const queueNote =
    queue.length > 0
      ? hi
        ? `\n(Baad mein aur ${queue.length} product bhi add karenge.)`
        : `\n(${queue.length} more after this.)`
      : "";

  return {
    assistantMessage: hi
      ? `${product.name}${product.size ? ` (${product.size})` : ""} select ho gaya.\nKitni quantity? (1–${maxQ})${queueNote}`
      : `Selected ${product.name}${product.size ? ` (${product.size})` : ""}.\nHow many? (1–${maxQ})${queueNote}`,
    toolCalls: [],
    toolResults: [],
    contextPatch: {
      selectedProduct: product,
      pendingQuantity: true,
      pendingProductSelection: false,
      pendingConfirmation: null,
      pendingTool: "addToCart",
      pendingAddQuantity: null,
      pendingProductQueue: queue,
    },
    uiAction: null,
    products: [product],
  };
}

export function buildAddConfirmation(
  product: SessionProduct,
  quantity: number,
  hi: boolean,
): AgentTurnResult {
  const confirmation: ConfirmationPayload = {
    title: hi ? "Cart mein add karein?" : "Add to cart?",
    summary: {
      Product: product.name,
      Size: product.size || "—",
      Quantity: String(quantity),
      Price:
        product.discountedPrice != null
          ? `₹${product.discountedPrice}`
          : product.price != null
            ? `₹${product.price}`
            : "—",
    },
    toolName: "addToCart",
    toolArgs: {
      productId: product._id,
      quantity,
      name: product.name,
      image: product.image ?? null,
    },
  };

  const lines = Object.entries(confirmation.summary)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  return {
    assistantMessage: hi
      ? `${confirmation.title}\n${lines}\nConfirm? (Haan / Nahi)`
      : `${confirmation.title}\n${lines}\nConfirm? (Yes / No)`,
    toolCalls: [],
    toolResults: [],
    contextPatch: {
      selectedProduct: product,
      pendingQuantity: false,
      pendingConfirmation: confirmation,
      pendingTool: "addToCart",
      pendingProductSelection: false,
    },
    uiAction: null,
    products: [product],
  };
}

/**
 * Greeting / chitchat during qty or confirm — answer briefly, keep shopping state.
 */
export function isHeldConversation(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return GREETING_ONLY.test(t) || isChitchat(t);
}

/** Short chitchat body without a shopping nudge (used while a write gate is open). */
export function buildShortChitchatLine(
  text: string,
  context: ConversationContext,
): string {
  const name = context.customerName ? `, ${context.customerName}` : "";
  const hi = preferHi(context.language, text);
  const t = normalizeChitchatText(text);
  if (GREETING_ONLY.test(text.trim())) {
    return hi ? `Namaste${name}!` : `Hello${name}!`;
  }
  if (/thanks?|thank\s+you|thx|ty|shukriya|dhanyavaad|dhanyavad/i.test(t)) {
    return hi ? `Ji bilkul${name}!` : `You're welcome${name}!`;
  }
  if (/bye|goodbye|good\s+night|see\s+you|phir\s+milte\s+hain/i.test(t)) {
    return hi
      ? `Alvida${name} — pehle ye confirm / quantity kar lo.`
      : `Bye${name} — let's finish this confirm / quantity first.`;
  }
  if (
    /who\s+are\s+you|tum\s+kaun|aap\s+kaun|what\s+can\s+you|kya\s+kar\s+sakte|kaise\s+kaam|help|madad/i.test(
      t,
    )
  ) {
    return hi
      ? `Main Shop Assist hoon${name}.`
      : `I'm Shop Assist${name}.`;
  }
  if (/what\s+(are\s+)?you\s+doing|wyd|kya\s+kar\s+(rahe|rhe)\s+ho/i.test(t)) {
    return hi
      ? `Bas aapki shopping mein madad kar raha hoon${name}.`
      : `Just helping you shop${name}.`;
  }
  // User wellbeing reply ("fine", "i am fine") after we asked how they are
  if (
    /^(i\s+(am|'m|m)\s+)?(doing\s+)?(fine|good|well|great|alright|ok|okay)\b/i.test(
      t,
    )
  ) {
    return hi ? `Achha laga sunke${name}!` : `Glad to hear${name}!`;
  }
  return hi ? `Main badhiya hoon${name}!` : `I'm doing well${name}!`;
}

export function resumeWriteGatePrompt(
  context: ConversationContext,
  hi: boolean,
): string {
  if (context.pendingConfirmation) {
    const lines = Object.entries(context.pendingConfirmation.summary)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    return hi
      ? `Confirm? (Haan / Nahi)\n${lines}`
      : `Confirm? (Yes / No)\n${lines}`;
  }
  if (context.pendingQuantity && context.selectedProduct) {
    const p = context.selectedProduct;
    const maxQ = maxQtyFor(p);
    const size = p.size ? ` (${p.size})` : "";
    return hi
      ? `Kitni quantity chahiye for ${p.name}${size}? (1–${maxQ})`
      : `How many for ${p.name}${size}? (1–${maxQ})`;
  }
  return hi ? "Kaunsa product chahiye?" : "Which product do you want?";
}

/**
 * While waiting for Haan/Nahi (or qty), allow pivoting to a new cart/search intent.
 * Greeting/chitchat is NOT a soft-escape — use isHeldConversation + resume prompt.
 */
export function isSoftEscapeIntent(
  text: string,
  context: ConversationContext,
): boolean {
  const t = text.trim();
  if (!t || isAffirm(t) || DENY.test(t)) return false;
  if (/^(hmm+|uh+|um+|aa+|huh+|ok+|okay)\.?$/i.test(t)) return false;
  // Quantity replies ("teen", "2 pcs") must not pivot to a new search
  if (parseQuantity(t) != null) return false;
  if (Object.prototype.hasOwnProperty.call(INDEX_WORDS, t.toLowerCase())) {
    return false;
  }
  // Pure conversation must hold the write gate — never clear shopping state.
  if (isHeldConversation(t)) return false;
  // Soft declines are not a product pivot
  if (isShoppingDecline(t)) return false;
  if (wantsCheckout(t)) return true;
  if (LIST_CART_HINTS.test(t) && !/\b(add|daal|dal)\b/i.test(t)) return true;
  if (OPEN_CART_HINTS.test(t) && !/\b(add|daal|dal)\b/i.test(t)) return true;
  if (CART_TOTAL_HINTS.test(t)) return true;
  if (CLEAR_CART_HINTS.test(t) && !/\b(add|daal|dal)\b/i.test(t)) return true;
  if (MORE_RESULTS_HINTS.test(t) && context.lastSearchQuery) return true;
  const parsed = parseMultiProductQuery(t);
  if (parsed && parsed.keywords.length >= 1) {
    const kw = parsed.keywords.join(" ").trim();
    // Only escape for a real shopping signal — not leftover words like "fine"/"weather"
    if (
      kw.length >= 3 &&
      !/^(hmm+|uh+|um+|aa+|huh+)$/i.test(kw) &&
      isShoppingUtterance(t, { keyword: kw })
    ) {
      return true;
    }
  }
  return false;
}

export function clearPendingWriteState(
  context: ConversationContext,
): ConversationContext {
  return {
    ...context,
    pendingConfirmation: null,
    pendingQuantity: false,
    selectedProduct: null,
    pendingTool: null,
    pendingAddQuantity: null,
    // Keep multi-buy queues — user cancelled only this confirm/qty step
  };
}

export function oilVariantHints(products: SessionProduct[]): string[] {
  const variants = [
    "mustard",
    "sunflower",
    "groundnut",
    "coconut",
    "soybean",
    "olive",
    "rice bran",
    "kachi ghani",
  ];
  const found: string[] = [];
  const seen = new Set<string>();
  for (const p of products) {
    const n = (p.name ?? "").toLowerCase();
    for (const v of variants) {
      if (n.includes(v) && !seen.has(v)) {
        seen.add(v);
        found.push(v);
      }
    }
  }
  return found;
}

export function sharedBrandPrefix(products: SessionProduct[]): string | null {
  if (products.length < 2) return null;
  const firsts = products.map((p) =>
    (p.name ?? "").trim().split(/\s+/)[0]?.toLowerCase(),
  );
  if (!firsts[0] || firsts[0].length < 3) return null;
  return firsts.every((f) => f === firsts[0]) ? firsts[0] : null;
}
