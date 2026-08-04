import { nanoid } from "@reduxjs/toolkit";
import type {
  AgentTurnResult,
  ConversationContext,
  SessionProduct,
  ToolCall,
  ToolResult,
  UiAction,
  TurnPlan,
} from "../types";
import { DEFAULT_MAX_CART_QTY } from "../types";
import { sizeMatchesProduct } from "../searchQuality";
import { syncPhaseIntoPatch } from "./phase";
import { preferHi, languagePatch } from "./language";
import { isAffirm } from "./intentPlanner";
import { tryHandleDialogueGates } from "./dialogueManager";
import { planToolsFromUtterance } from "./toolPlanner";
import { maxQtyFor, oilVariantHints, sharedBrandPrefix, formatProductLine, askQuantityResult } from "./dialogueHelpers";

// Re-export for tests
export { sizeMatchesProduct } from "../searchQuality";
export { parseSizeHint, parseProductIndices, extractSearchKeyword, extractGroceryList, extractGroceryListWithBrands, parseMultiProductQuery, parseMultiProductKeywords, parseQuantity, parseAddQuantity, isBrandOnlyKeyword } from "./extractEntities";
export { wantsAddToCart, wantsCheckout } from "./intentPlanner";
export { classifyUtterance, CATEGORY_PRECEDENCE } from "./utteranceClassifier";
export { getBroadCategoryClarify } from "./broadCategories";
export type {
  UtteranceCategory,
  UtteranceClassification,
} from "./utteranceClassifier";

import type { ShopIntent } from "../types";
import { derivePhase } from "../types";

export type PlanTurnOutput = {
  toolCalls: ToolCall[];
  earlyResult?: AgentTurnResult;
  sessionPatch?: Partial<ConversationContext>;
  notePrefix?: string;
  turnPlan?: TurnPlan;
};

function attachTurnPlan(
  result: {
    toolCalls: ToolCall[];
    earlyResult?: AgentTurnResult;
    sessionPatch?: Partial<ConversationContext>;
    notePrefix?: string;
    intent?: ShopIntent | string;
    confidence?: number;
  },
  context: ConversationContext,
): PlanTurnOutput {
  const patch = {
    ...(result.sessionPatch ?? {}),
    ...(result.earlyResult?.contextPatch ?? {}),
  };
  const synced = syncPhaseIntoPatch(context, patch);
  const phaseAfter = synced.phase ?? derivePhase({ ...context, ...synced });
  const turnPlan: TurnPlan = {
    intent: (result.intent as ShopIntent) ?? "unknown",
    confidence: result.confidence,
    tools: result.toolCalls,
    clarify: result.toolCalls.length === 0
      ? result.earlyResult?.assistantMessage
      : undefined,
    phaseAfter,
  };

  let earlyResult = result.earlyResult;
  if (earlyResult) {
    earlyResult = {
      ...earlyResult,
      contextPatch: syncPhaseIntoPatch(context, earlyResult.contextPatch ?? {}),
      turnPlan,
    };
  }

  return {
    toolCalls: result.toolCalls,
    earlyResult,
    sessionPatch: result.sessionPatch
      ? syncPhaseIntoPatch(context, result.sessionPatch)
      : result.sessionPatch,
    notePrefix: result.notePrefix,
    turnPlan,
  };
}

export function planTurn(
  userText: string,
  context: ConversationContext,
): PlanTurnOutput {
  const gates = tryHandleDialogueGates(userText, context);
  if (gates) return attachTurnPlan(gates, context);
  const tools = planToolsFromUtterance(userText, context);
  return attachTurnPlan(tools, context);
}

export function buildResponseAfterTools(params: {
  userText: string;
  context: ConversationContext;
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
}): AgentTurnResult {
  const { userText, context, toolCalls, toolResults } = params;
  const hi = preferHi(context.language, userText);
  const langPatch = languagePatch(context, userText);

  const searchResult = toolResults.find((r) => r.toolName === "searchProducts");
  const addResult = toolResults.find((r) => r.toolName === "addToCart");
  const clearResult = toolResults.find((r) => r.toolName === "clearCart");
  const openUiResult = toolResults.find((r) => r.toolName === "openUi");
  const cartResult = toolResults.find((r) => r.toolName === "getCart");
  const checkoutResult = toolResults.find((r) => r.toolName === "startCheckout");

  let uiAction: UiAction | null = null;
  if (openUiResult?.ok && openUiResult.data) {
    uiAction =
      (openUiResult.data as { uiAction?: UiAction }).uiAction ?? null;
  }

  if (checkoutResult) {
    if (!checkoutResult.ok) {
      return {
        assistantMessage: hi
          ? `Checkout fail: ${checkoutResult.error ?? "error"}`
          : `Checkout failed: ${checkoutResult.error ?? "error"}`,
        toolCalls,
        toolResults,
        contextPatch: syncPhaseIntoPatch(context, { ...langPatch, paymentPending: false }),
        uiAction: null,
      };
    }

    const data = checkoutResult.data as {
      status: "proceed" | "abort" | "blocked";
      reason?: string;
      message?: string;
      payableTotal?: number;
      cartUpdated?: boolean;
      cartItemCount?: number;
      cartItems?: ConversationContext["cartItems"];
    };

    if (data.status === "blocked" && data.reason === "login") {
      return {
        assistantMessage: hi
          ? "Checkout ke liye pehle login karo."
          : "Please login to checkout.",
        toolCalls,
        toolResults,
        contextPatch: syncPhaseIntoPatch(context, { ...langPatch }),
        uiAction: { action: "OPEN_LOGIN" },
      };
    }

    if (data.status === "blocked") {
      return {
        assistantMessage: hi
          ? data.message ?? "Cart khali hai — pehle kuch add karo."
          : data.message ?? "Cart is empty — add something first.",
        toolCalls,
        toolResults,
        contextPatch: syncPhaseIntoPatch(context, {
          ...langPatch,
          cartItemCount: data.cartItemCount ?? context.cartItemCount,
        }),
        uiAction: null,
      };
    }

    if (data.status === "abort") {
      const items = data.cartItems ?? context.cartItems ?? [];
      const cartLines =
        items.length > 0
          ? items
              .map((item, i) => {
                const price =
                  item.lineTotal != null
                    ? ` — ₹${item.lineTotal}`
                    : item.unitPrice != null
                      ? ` — ₹${item.unitPrice} × ${item.quantity}`
                      : "";
                return `${i + 1}. ${item.name ?? "Item"} × ${item.quantity}${price}`;
              })
              .join("\n")
          : "";
      const cartBlock = cartLines
        ? hi
          ? `\n\nUpdated cart:\n${cartLines}\nReview karke phir "checkout karo" bolo.`
          : `\n\nUpdated cart:\n${cartLines}\nReview, then say "checkout" again.`
        : hi
          ? " Review karke phir try karo."
          : " Please review and try again.";

      return {
        assistantMessage: `${data.message ?? (hi ? "Checkout ruk gaya." : "Checkout stopped.")}${
          data.cartUpdated || cartLines ? cartBlock : ""
        }`,
        toolCalls,
        toolResults,
        contextPatch: syncPhaseIntoPatch(context, {
          ...langPatch,
          paymentPending: false,
          cartItemCount: data.cartItemCount ?? items.length,
          ...(items.length ? { cartItems: items } : {}),
        }),
        uiAction: null,
      };
    }

    // proceed → address + pay UI
    return {
      assistantMessage: hi
        ? `Cart sync OK. Payable ≈ ₹${data.payableTotal ?? "—"}. Ab address choose karke payment complete karo.`
        : `Cart synced. Payable ≈ ₹${data.payableTotal ?? "—"}. Pick address and complete payment.`,
      toolCalls,
      toolResults,
      contextPatch: syncPhaseIntoPatch(context, {
        ...langPatch,
        paymentPending: true,
        pendingConfirmation: null,
        pendingQuantity: false,
        pendingProductSelection: false,
        pendingSearchQueue: [],
        pendingProductQueue: [],
        selectedProduct: null,
      }),
      uiAction: { action: "OPEN_PAYMENT" },
    };
  }

  if (clearResult) {
    if (!clearResult.ok) {
      return {
        assistantMessage: hi
          ? `Cart clear nahi hua: ${clearResult.error ?? "error"}`
          : `Could not clear cart: ${clearResult.error ?? "error"}`,
        toolCalls,
        toolResults,
        contextPatch: syncPhaseIntoPatch(context, {
          ...langPatch,
          pendingConfirmation: null,
          pendingTool: null,
        }),
        uiAction: null,
      };
    }
    return {
      assistantMessage: hi
        ? "Cart khali kar diya."
        : "Cart cleared.",
      toolCalls,
      toolResults,
      contextPatch: syncPhaseIntoPatch(context, {
        ...langPatch,
        pendingConfirmation: null,
        pendingTool: null,
        pendingQuantity: false,
        selectedProduct: null,
        pendingProductQueue: [],
        cartItemCount: 0,
        cartItems: [],
      }),
      uiAction: null,
    };
  }

  if (addResult) {
    if (!addResult.ok) {
      const needsLogin = /login/i.test(addResult.error ?? "");
      return {
        assistantMessage: hi
          ? needsLogin
            ? "Cart ke liye login zaroori hai."
            : `Cart update fail: ${addResult.error ?? "error"}`
          : needsLogin
            ? "Please login to update your cart."
            : `Could not update cart: ${addResult.error ?? "error"}`,
        toolCalls,
        toolResults,
        contextPatch: syncPhaseIntoPatch(context, {
          ...langPatch,
          pendingConfirmation: null,
          pendingQuantity: false,
          pendingTool: null,
        }),
        uiAction: needsLogin ? { action: "OPEN_LOGIN" } : null,
      };
    }

    const data = addResult.data as {
      name?: string;
      quantity: number;
      cartItemCount: number;
      cartItems: ConversationContext["cartItems"];
      lineQuantity: number;
    };

    const queue = context.pendingProductQueue ?? [];
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      const maxQ = maxQtyFor(next);
      return {
        assistantMessage: hi
          ? `${data.name ?? "Product"} × ${data.lineQuantity} cart mein add ho gaya.\nAb next: ${next.name}${next.size ? ` (${next.size})` : ""} — kitni quantity? (1–${maxQ})`
          : `Added ${data.name ?? "product"} × ${data.lineQuantity}.\nNext: ${next.name}${next.size ? ` (${next.size})` : ""} — how many? (1–${maxQ})`,
        toolCalls,
        toolResults,
        contextPatch: syncPhaseIntoPatch(context, {
          ...langPatch,
          pendingConfirmation: null,
          pendingQuantity: true,
          selectedProduct: next,
          pendingProductSelection: false,
          pendingTool: "addToCart",
          pendingProductQueue: rest,
          pendingSearchQueue: context.pendingSearchQueue ?? [],
          cartItemCount: data.cartItemCount,
          cartItems: data.cartItems,
        }),
        uiAction: null,
        products: [next],
      };
    }

    const searchQueue = context.pendingSearchQueue ?? [];
    if (searchQueue.length > 0) {
      return {
        assistantMessage: hi
          ? `${data.name ?? "Product"} × ${data.lineQuantity} cart mein add ho gaya (${data.cartItemCount} items).\nAb next: ${searchQueue[0]}…`
          : `Added ${data.name ?? "product"} × ${data.lineQuantity} (${data.cartItemCount} items).\nNext: ${searchQueue[0]}…`,
        toolCalls,
        toolResults,
        contextPatch: syncPhaseIntoPatch(context, {
          ...langPatch,
          pendingConfirmation: null,
          pendingQuantity: false,
          selectedProduct: null,
          pendingProductSelection: false,
          pendingTool: "continueSearchQueue",
          pendingProductQueue: [],
          pendingSearchQueue: searchQueue,
          pendingAddQuantity: null,
          cartItemCount: data.cartItemCount,
          cartItems: data.cartItems,
        }),
        uiAction: null,
      };
    }

    return {
      assistantMessage: hi
        ? `${data.name ?? "Product"} × ${data.lineQuantity} cart mein add ho gaya (${data.cartItemCount} items). Cart dekhna hai to "cart dikhao" bolo; page ke liye "cart page open karo".`
        : `Added ${data.name ?? "product"} × ${data.lineQuantity} (${data.cartItemCount} items in cart). Say "cart dikhao" to list items, or "open cart page" to open cart.`,
      toolCalls,
      toolResults,
      contextPatch: syncPhaseIntoPatch(context, {
        ...langPatch,
        pendingConfirmation: null,
        pendingQuantity: false,
        selectedProduct: null,
        pendingProductSelection: false,
        pendingTool: null,
        pendingProductQueue: [],
        pendingSearchQueue: [],
        pendingAddQuantity: null,
        cartItemCount: data.cartItemCount,
        cartItems: data.cartItems,
      }),
      uiAction: null,
    };
  }

  if (uiAction?.action === "OPEN_PRODUCT_DETAIL") {
    const product =
      context.selectedProduct ||
      context.lastSearchProducts.find((p) => p._id === uiAction.productId);
    return {
      assistantMessage: hi
        ? `${product?.name ?? "Product"} khol diya.`
        : `Opened ${product?.name ?? "product"}.`,
      toolCalls,
      toolResults,
      contextPatch: {},
      uiAction,
      products: product ? [product] : undefined,
    };
  }

  if (uiAction?.action === "OPEN_CART") {
    const count = context.cartItemCount;
    return {
      assistantMessage:
        count === 0
          ? hi
            ? "Cart abhi khali hai — phir bhi cart screen khol raha hoon."
            : "Cart is empty — opening cart screen anyway."
          : hi
            ? `Cart mein ${count} items. Cart khol raha hoon.`
            : `Opening cart (${count} items).`,
      toolCalls,
      toolResults,
      contextPatch: {},
      uiAction,
    };
  }

  if (uiAction?.action === "OPEN_SEARCH_RESULTS") {
    const query =
      ("query" in uiAction && uiAction.query) ||
      context.lastSearchQuery ||
      "";
    return {
      assistantMessage: hi
        ? `"${query}" ke saare results screen pe khol raha hoon.`
        : `Opening all results for "${query}".`,
      toolCalls,
      toolResults,
      contextPatch: syncPhaseIntoPatch(context, { ...langPatch }),
      uiAction,
    };
  }

  if (uiAction?.action === "OPEN_PAYMENT") {
    return {
      assistantMessage: hi
        ? "Address / payment screen khol raha hoon."
        : "Opening address / payment screen.",
      toolCalls,
      toolResults,
      contextPatch: syncPhaseIntoPatch(context, { ...langPatch, paymentPending: true }),
      uiAction,
    };
  }

  if (uiAction?.action === "OPEN_LOGIN") {
    return {
      assistantMessage: hi
        ? "Login screen khol raha hoon."
        : "Opening login.",
      toolCalls,
      toolResults,
      contextPatch: syncPhaseIntoPatch(context, { ...langPatch }),
      uiAction,
    };
  }

  if (cartResult?.ok) {
    const data = cartResult.data as {
      mode?: string;
      itemCount: number;
      items: ConversationContext["cartItems"];
      subtotal?: number | null;
      payableTotal?: number | null;
    };
    const mode = data.mode ?? "list";

    if (data.itemCount === 0) {
      return {
        assistantMessage: hi ? "Cart abhi khali hai." : "Your cart is empty.",
        toolCalls,
        toolResults,
        contextPatch: syncPhaseIntoPatch(context, {
          ...langPatch,
          cartItemCount: 0,
          cartItems: [],
        }),
        uiAction: null,
      };
    }

    if (mode === "total") {
      const total =
        data.payableTotal ??
        data.subtotal ??
        data.items.reduce((s, i) => s + (i.lineTotal ?? 0), 0);
      return {
        assistantMessage: hi
          ? `Cart ka total roughly ₹${total} hai (${data.itemCount} items). Exact bill checkout par dikhega.`
          : `Cart total is about ₹${total} (${data.itemCount} items). Final bill shows at checkout.`,
        toolCalls,
        toolResults,
        contextPatch: syncPhaseIntoPatch(context, {
          ...langPatch,
          cartItemCount: data.itemCount,
          cartItems: data.items,
        }),
        uiAction: null,
      };
    }

    const lines = data.items
      .map((item, i) => {
        const price =
          item.lineTotal != null
            ? ` — ₹${item.lineTotal}`
            : item.unitPrice != null
              ? ` — ₹${item.unitPrice} × ${item.quantity}`
              : "";
        return `${i + 1}. ${item.name ?? "Item"} × ${item.quantity}${price}`;
      })
      .join("\n");
    const total =
      data.payableTotal ??
      data.subtotal ??
      data.items.reduce((s, i) => s + (i.lineTotal ?? 0), 0);
    const totalLine =
      total != null
        ? hi
          ? `\nApprox total: ₹${total}`
          : `\nApprox total: ₹${total}`
        : "";

    return {
      assistantMessage: hi
        ? `Cart mein yeh items hain:\n${lines}${totalLine}`
        : `Your cart:\n${lines}${totalLine}`,
      toolCalls,
      toolResults,
      contextPatch: syncPhaseIntoPatch(context, {
        ...langPatch,
        cartItemCount: data.itemCount,
        cartItems: data.items,
      }),
      uiAction: null,
    };
  }

  if (searchResult) {
    if (!searchResult.ok) {
      return {
        assistantMessage: hi
          ? `Search fail ho gaya: ${searchResult.error ?? "unknown error"}`
          : `Search failed: ${searchResult.error ?? "unknown error"}`,
        toolCalls,
        toolResults,
        contextPatch: {
          pendingProductSelection: false,
          lastSearchProducts: [],
          lastSearchQuery: null,
        },
        uiAction: null,
      };
    }

    const data = searchResult.data as {
      keyword: string;
      resolvedKeyword?: string;
      count: number;
      totalResults?: number;
      hasMore?: boolean;
      products: SessionProduct[];
    };
    const searchArgs = (toolCalls.find((c) => c.name === "searchProducts")
      ?.args ?? {}) as {
      intent?: string;
      preferSize?: string;
      preferQty?: number;
      searchQueue?: string[];
    };
    const preferSize = searchArgs.preferSize ?? null;
    const addIntent = searchArgs.intent === "add";
    const preferQty =
      typeof searchArgs.preferQty === "number" && searchArgs.preferQty >= 1
        ? Math.min(searchArgs.preferQty, DEFAULT_MAX_CART_QTY)
        : 1;
    const searchQueue = Array.isArray(searchArgs.searchQueue)
      ? searchArgs.searchQueue.filter((k) => typeof k === "string" && k.trim())
      : (context.pendingSearchQueue ?? []);
    const queuePatch = {
      pendingSearchQueue: searchQueue,
      pendingMultiProductConfirm: null,
      pendingSearchPreferSize:
        searchQueue.length > 0 ? (context.pendingSearchPreferSize ?? null) : null,
    };
    const queueNote =
      searchQueue.length > 0
        ? hi
          ? `\nPehle "${data.keyword}" — baad mein: ${searchQueue.join(", ")}.`
          : `\nFirst "${data.keyword}" — then: ${searchQueue.join(", ")}.`
        : "";
    const resolvedQuery = data.resolvedKeyword ?? data.keyword;
    const totalResults = data.totalResults ?? data.count;
    const apiHasMore =
      data.hasMore === true || totalResults > (data.products?.length ?? 0);

    if (data.count === 0) {
      const hasNext = searchQueue.length > 0;
      return {
        assistantMessage: hi
          ? `"${data.keyword}" ke liye kuch nahi mila.${
              hasNext
                ? ` Next try: ${searchQueue[0]}…`
                : " Koi aur naam try karo."
            }`
          : `No products found for "${data.keyword}".${
              hasNext
                ? ` Trying next: ${searchQueue[0]}…`
                : " Try another name."
            }`,
        toolCalls,
        toolResults,
        contextPatch: syncPhaseIntoPatch(context, {
          ...langPatch,
          ...queuePatch,
          lastSearchQuery: resolvedQuery,
          lastSearchProducts: [],
          pendingProductSelection: false,
          pendingTool: hasNext ? "continueSearchQueue" : null,
          selectedProduct: null,
          pendingQuantity: false,
        }),
        uiAction: null,
      };
    }

    let products = data.products;
    if (preferSize) {
      const sized = products.filter((p) => sizeMatchesProduct(p, preferSize));
      if (sized.length > 0) products = sized;
    }
    // Prefer in-stock first in the chip list
    products = [...products].sort((a, b) => {
      const ao = a.isOutOfStock ? 1 : 0;
      const bo = b.isOutOfStock ? 1 : 0;
      return ao - bo;
    });

    const hasMore = apiHasMore || (preferSize != null && data.count > products.length);
    const fullSetLoaded =
      !apiHasMore && (data.products?.length ?? 0) >= totalResults;
    const moreUiAction: UiAction | null = hasMore
      ? { action: "OPEN_SEARCH_RESULTS", query: resolvedQuery }
      : null;
    const moreNote = hasMore
      ? hi
        ? `\nTop ${products.length} dikha raha hoon (${totalResults} total). Aur dekhne ke liye neeche "Aur results" dabao ya "aur dikhao" bolo.`
        : `\nShowing top ${products.length} of ${totalResults}. Tap "More results" below or say "view all".`
      : "";

    // Unique size match → confirm qty 1 (skip separate qty ask)
    if (preferSize && products.length === 1 && fullSetLoaded) {
      const product = products[0];
      if (product.isOutOfStock) {
        return {
          assistantMessage: hi
            ? `${queueNote ? queueNote.trim() + "\n" : ""}${product.name}${
                product.size ? ` (${product.size})` : ""
              } abhi out of stock hai. Koi aur size/brand bolo ya "aur dikhao".${moreNote}`
            : `${queueNote ? queueNote.trim() + "\n" : ""}${product.name}${
                product.size ? ` (${product.size})` : ""
              } is out of stock. Try another size/brand or say "view all".${moreNote}`,
          toolCalls,
          toolResults,
          contextPatch: syncPhaseIntoPatch(context, {
            ...langPatch,
            ...queuePatch,
            lastSearchQuery: resolvedQuery,
            lastSearchProducts: products,
            pendingProductSelection: false,
            pendingConfirmation: null,
            pendingQuantity: false,
            selectedProduct: null,
            pendingAddQuantity: null,
            pendingBrand: null,
          }),
          uiAction: moreUiAction,
          products,
        };
      }
      const qty = addIntent ? preferQty : 1;
      const confirmed = askQuantityResult(product, hi, [], qty);
      return {
        ...confirmed,
        assistantMessage: `${queueNote ? queueNote.trim() + "\n" : ""}${confirmed.assistantMessage}`,
        toolCalls,
        toolResults,
        contextPatch: syncPhaseIntoPatch(context, {
          ...langPatch,
          lastSearchQuery: resolvedQuery,
          lastSearchProducts: products,
          ...confirmed.contextPatch,
          ...queuePatch,
          pendingAddQuantity: null,
          pendingBrand: null,
        }),
        products,
      };
    }

    // One-shot add: unique SKU only when the full result set is loaded
    if (addIntent && products.length === 1 && fullSetLoaded) {
      const product = products[0];
      if (product.isOutOfStock) {
        return {
          assistantMessage: hi
            ? `${queueNote ? queueNote.trim() + "\n" : ""}${product.name}${
                product.size ? ` (${product.size})` : ""
              } abhi out of stock hai. Koi aur size/brand bolo ya "aur dikhao".${moreNote}`
            : `${queueNote ? queueNote.trim() + "\n" : ""}${product.name}${
                product.size ? ` (${product.size})` : ""
              } is out of stock. Try another size/brand or say "view all".${moreNote}`,
          toolCalls,
          toolResults,
          contextPatch: syncPhaseIntoPatch(context, {
            ...langPatch,
            ...queuePatch,
            lastSearchQuery: resolvedQuery,
            lastSearchProducts: products,
            pendingProductSelection: false,
            pendingConfirmation: null,
            pendingQuantity: false,
            selectedProduct: null,
            pendingAddQuantity: null,
          }),
          uiAction: moreUiAction,
          products,
        };
      }

      const confirmed = askQuantityResult(product, hi, [], preferQty);
      return {
        ...confirmed,
        assistantMessage: `${queueNote ? queueNote.trim() + "\n" : ""}${confirmed.assistantMessage}`,
        toolCalls,
        toolResults,
        contextPatch: syncPhaseIntoPatch(context, {
          ...langPatch,
          lastSearchQuery: resolvedQuery,
          lastSearchProducts: products,
          ...confirmed.contextPatch,
          ...queuePatch,
          pendingAddQuantity: null,
        }),
        products,
      };
    }

    // Single hit on a partial page → still ask (more Fortune oils may exist)
    if (products.length === 1 && fullSetLoaded) {
      const product = products[0];
      return {
        assistantMessage: hi
          ? `${queueNote ? queueNote.trim() + "\n" : ""}Mil gaya: ${formatProductLine(product, 0)}\nCart mein add karein? "Haan" bolo ya 1.${moreNote}`
          : `${queueNote ? queueNote.trim() + "\n" : ""}Found: ${formatProductLine(product, 0)}\nAdd to cart? Say "yes" or 1.${moreNote}`,
        toolCalls,
        toolResults,
        contextPatch: syncPhaseIntoPatch(context, {
          ...langPatch,
          ...queuePatch,
          lastSearchQuery: resolvedQuery,
          lastSearchProducts: products,
          pendingProductSelection: true,
          pendingTool: "searchProducts",
          selectedProduct: null,
          pendingQuantity: false,
          pendingConfirmation: null,
          pendingProductQueue: [],
          ...(addIntent ? { pendingAddQuantity: preferQty } : {}),
        }),
        uiAction: moreUiAction,
        products,
      };
    }

    const lines = products.map((p, i) => formatProductLine(p, i)).join("\n");
    const sizeNote =
      preferSize && products.length < data.count
        ? hi
          ? ` (${preferSize} match)`
          : ` (${preferSize} matches)`
        : "";
    const shownLabel = hasMore
      ? hi
        ? `top ${products.length}/${totalResults}`
        : `top ${products.length}/${totalResults}`
      : String(products.length);
    const variants = oilVariantHints(products);
    const brand = sharedBrandPrefix(products);
    const variantHint =
      variants.length >= 2
        ? hi
          ? ` Kaunsa${brand ? ` ${brand}` : ""} — ${variants.join(" / ")}?`
          : ` Which${brand ? ` ${brand}` : ""} — ${variants.join(" / ")}?`
        : brand && products.length >= 2
          ? hi
            ? ` Kaunsa ${brand} variant?`
            : ` Which ${brand} variant?`
          : "";
    return {
      assistantMessage: hi
        ? `${queueNote ? queueNote.trim() + "\n" : ""}${
            addIntent
              ? `"${data.keyword}" ke ${shownLabel} options${sizeNote}.${variantHint || " Kaunsa add karun?"} Number bolo.\n${lines}${moreNote}`
              : `"${data.keyword}" ke ${shownLabel} options${sizeNote}.${variantHint || " Kaunsa chahiye?"} Number bolo.\n${lines}${moreNote}`
          }`
        : `${queueNote ? queueNote.trim() + "\n" : ""}${
            addIntent
              ? `Found ${shownLabel} options for "${data.keyword}"${sizeNote}.${variantHint || " Which to add?"} Reply with a number.\n${lines}${moreNote}`
              : `Found ${shownLabel} options for "${data.keyword}"${sizeNote}.${variantHint || " Which one?"} Reply with a number.\n${lines}${moreNote}`
          }`,
      toolCalls,
      toolResults,
      contextPatch: syncPhaseIntoPatch(context, {
        ...langPatch,
        ...queuePatch,
        lastSearchQuery: resolvedQuery,
        lastSearchProducts: products,
        pendingProductSelection: true,
        pendingTool: "searchProducts",
        selectedProduct: null,
        pendingQuantity: false,
        pendingConfirmation: null,
        pendingProductQueue: [],
        ...(addIntent ? { pendingAddQuantity: preferQty } : {}),
      }),
      uiAction: moreUiAction,
      products,
    };
  }

  return {
    assistantMessage: hi
      ? "Abhi yeh action support nahi hai — product search try karo."
      : "That action isn't supported yet — try a product search.",
    toolCalls,
    toolResults,
    contextPatch: syncPhaseIntoPatch(context, { ...langPatch }),
    uiAction,
  };
}

/** @deprecated Affirm is handled inside planTurn; kept for tests. */
export function maybeAffirmSelection(
  userText: string,
  context: ConversationContext,
): ToolCall[] | null {
  if (context.pendingConfirmation && isAffirm(userText.trim())) {
    return [
      {
        id: nanoid(),
        name: context.pendingConfirmation.toolName,
        args: context.pendingConfirmation.toolArgs,
      },
    ];
  }
  return null;
}
