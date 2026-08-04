import { nanoid } from "@reduxjs/toolkit";
import type { AgentTurnResult, ConversationContext, ShopIntent, ToolCall } from "../types";
import { preferHi, languagePatch } from "./language";
import {
  GREETING_ONLY,
  isChitchat,
  normalizeChitchatText,
  isAffirm,
  DENY,
  wantsCheckout,
  CART_TOTAL_HINTS,
  CLEAR_CART_HINTS,
  LIST_CART_HINTS,
  OPEN_CART_HINTS,
  MORE_RESULTS_HINTS,
  DETAIL_HINTS,
  isShoppingDecline,
  isSoftNo,
  isShoppingAdvice,
  INDEX_WORDS,
} from "./intentPlanner";
import {
  parseProductIndices,
  parseQuantity,
  parseMultiProductQuery,
  keywordLooksSizeful,
} from "./extractEntities";
import {
  matchPendingProduct,
  formatProductLine,
  askQuantityResult,
  buildAddConfirmation,
  isSoftEscapeIntent,
  clearPendingWriteState,
  maxQtyFor,
  isHeldConversation,
  buildShortChitchatLine,
  resumeWriteGatePrompt,
} from "./dialogueHelpers";
import {
  CONFIDENCE_CLARIFY_THRESHOLD,
  scoreProductPickConfidence,
} from "./confidence";
import { buildShoppingAdviceMessage } from "./shoppingAdvice";
import {
  buildCategoryListMessage,
  isCategoryCatalogQuestion,
  matchCategoryListSelection,
} from "./storeCategories";
import { buildBroadCategoryClarifyTurn } from "./broadCategories";

export type PlanTurnResult = {
  toolCalls: ToolCall[];
  earlyResult?: AgentTurnResult;
  sessionPatch?: Partial<ConversationContext>;
  notePrefix?: string;
  intent?: ShopIntent;
  confidence?: number;
};

/**
 * Try to handle the turn via dialogue state machine gates.
 * Returns PlanTurnResult if handled, null if should fall through to tool planning.
 */
export function tryHandleDialogueGates(
  userText: string,
  context: ConversationContext,
): PlanTurnResult | null {
  const text = userText.trim();
  const hi = preferHi(context.language, userText);
  const langPatch = languagePatch(context, userText);

  // Empty input
  if (!text) {
    return {
      toolCalls: [],
      earlyResult: {
        assistantMessage: hi
          ? "Kuch bolo — kaunsa product chahiye?"
          : "Say a product name to search.",
        toolCalls: [],
        toolResults: [],
        contextPatch: { lastAssistantPromptType: "shopping_prompt" },
        uiAction: null,
      },
      sessionPatch: {},
      intent: "unknown",
    };
  }

  // Payment gate — cancel without searching
  if (context.paymentPending) {
    if (DENY.test(text) || isSoftNo(text) || isShoppingDecline(text)) {
      return {
        toolCalls: [],
        earlyResult: {
          assistantMessage: hi
            ? "Theek hai, payment cancel. Cart mein items rehne do — aur kuch chahiye?"
            : "Okay, cancelled payment. Your cart is unchanged — need anything else?",
          toolCalls: [],
          toolResults: [],
          contextPatch: {
            ...langPatch,
            paymentPending: false,
            lastAssistantPromptType: "shopping_prompt",
          },
          uiAction: null,
        },
        sessionPatch: {},
        intent: "deny",
      };
    }
    if (isHeldConversation(text) || GREETING_ONLY.test(text)) {
      const short = buildShortChitchatLine(text, context);
      return {
        toolCalls: [],
        earlyResult: {
          assistantMessage: hi
            ? `${short}\nPayment screen open hai — complete karo, ya "Nahi" bolo cancel ke liye.`
            : `${short}\nPayment is open — finish it, or say "No" to cancel.`,
          toolCalls: [],
          toolResults: [],
          contextPatch: languagePatch(context, text),
          uiAction: null,
        },
        sessionPatch: {},
        intent: "chitchat",
      };
    }
    if (isAffirm(text)) {
      return {
        toolCalls: [],
        earlyResult: {
          assistantMessage: hi
            ? "Payment screen pe address choose karke pay complete karo."
            : "On the payment screen, pick an address and complete payment.",
          toolCalls: [],
          toolResults: [],
          contextPatch: {},
          uiAction: { action: "OPEN_PAYMENT" },
        },
        sessionPatch: {},
        intent: "affirm",
      };
    }
  }

  // Brand → category follow-up ("Fortune" then "oil")
  if (context.pendingBrand) {
    const cat = text
      .toLowerCase()
      .replace(/[?!.,]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const CATEGORY_FOLLOW =
      /^(oil|tel|atta|aata|besan|rice|chawal|dal|daal|sugar|chini|ghee|flour|milk|doodh|salt|namak|tea|chai|masala|masale|spice|spices|powder|biscuit|biscuits|namkeen)$/i;
    if (CATEGORY_FOLLOW.test(cat)) {
      const brand = context.pendingBrand;
      const keyword = `${brand} ${cat}`.replace(/\s+/g, " ").trim();
      return {
        toolCalls: [
          {
            id: nanoid(),
            name: "searchProducts",
            args: { keyword, limit: 8 },
          },
        ],
        sessionPatch: {
          pendingBrand: null,
          lastAssistantPromptType: null,
        },
        intent: "search",
      };
    }
  }

  // Broad-category follow-up: user picks "1" / "haldi" / "turmeric powder"
  if (
    context.lastAssistantPromptType === "broad_category" &&
    (context.pendingBroadOptions?.length ?? 0) > 0
  ) {
    const options = context.pendingBroadOptions!;
    const multiIdx = parseProductIndices(text, options.length);
    if (multiIdx.length === 1) {
      const kw = options[multiIdx[0]];
      return {
        toolCalls: [
          {
            id: nanoid(),
            name: "searchProducts",
            args: { keyword: kw, limit: 8 },
          },
        ],
        sessionPatch: {
          lastAssistantPromptType: null,
          pendingBroadOptions: null,
        },
        intent: "search",
      };
    }
    const lower = text.toLowerCase().replace(/[?!.,]/g, " ").replace(/\s+/g, " ").trim();
    const wordIdx = INDEX_WORDS[lower];
    if (typeof wordIdx === "number") {
      const idx = wordIdx === -1 ? options.length - 1 : wordIdx;
      if (options[idx]) {
        return {
          toolCalls: [
            {
              id: nanoid(),
              name: "searchProducts",
              args: { keyword: options[idx], limit: 8 },
            },
          ],
          sessionPatch: {
            lastAssistantPromptType: null,
            pendingBroadOptions: null,
          },
          intent: "search",
        };
      }
    }
    const BROAD_ALIASES: Record<string, string> = {
      haldi: "turmeric powder",
      turmeric: "turmeric powder",
      dhaniya: "coriander powder",
      coriander: "coriander powder",
      talcum: "talcum powder",
      talc: "talcum powder",
      cocoa: "cocoa powder",
      chocolate: "cocoa powder",
      garam: "garam masala",
      mirch: "red chilli powder",
      mirchi: "red chilli powder",
      chilli: "red chilli powder",
      chili: "red chilli powder",
      jeera: "cumin",
      cumin: "cumin",
      hing: "hing",
      asafoetida: "hing",
      sarso: "mustard oil",
      mustard: "mustard oil",
      sunflower: "sunflower oil",
      nariyal: "coconut oil",
      coconut: "coconut oil",
      groundnut: "groundnut oil",
    };
    const aliased = BROAD_ALIASES[lower] ?? BROAD_ALIASES[lower.split(/\s+/)[0] ?? ""];
    const byName =
      (aliased && options.includes(aliased) ? aliased : null) ||
      options.find(
        (o) =>
          o.toLowerCase() === lower ||
          o.toLowerCase().includes(lower) ||
          lower.includes(o.toLowerCase().split(/\s+/)[0] ?? ""),
      );
    if (byName) {
      return {
        toolCalls: [
          {
            id: nanoid(),
            name: "searchProducts",
            args: { keyword: byName, limit: 8 },
          },
        ],
        sessionPatch: {
          lastAssistantPromptType: null,
          pendingBroadOptions: null,
        },
        intent: "search",
      };
    }
  }

  // Category-list follow-up: after "which category?", "Masale" / "5" / "Oil"
  if (context.lastAssistantPromptType === "category_list") {
    const selected = matchCategoryListSelection(text);
    if (selected) {
      if (selected.useBroadClarify) {
        const broadTurn = buildBroadCategoryClarifyTurn(
          selected.keyword,
          hi,
          langPatch,
        );
        if (broadTurn) return broadTurn;
      }
      return {
        toolCalls: [
          {
            id: nanoid(),
            name: "searchProducts",
            args: { keyword: selected.keyword, limit: 8 },
          },
        ],
        sessionPatch: {
          lastAssistantPromptType: null,
        },
        intent: "search",
        confidence: 0.9,
      };
    }
  }

  // Continue multi-buy queue
  if (
    context.pendingTool === "continueSearchQueue" &&
    (context.pendingSearchQueue?.length ?? 0) > 0 &&
    (isAffirm(text) || /^(skip|next|aage|agla)\b/i.test(text))
  ) {
    const [keyword, ...rest] = context.pendingSearchQueue;
    const preferSize =
      context.pendingSearchPreferSize && keywordLooksSizeful(keyword)
        ? context.pendingSearchPreferSize
        : null;
    return {
      toolCalls: [
        {
          id: nanoid(),
          name: "searchProducts",
          args: {
            keyword,
            limit: preferSize ? 12 : 8,
            ...(rest.length > 0 ? { searchQueue: rest } : {}),
            ...(preferSize ? { preferSize } : {}),
          },
        },
      ],
      sessionPatch: {
        pendingSearchQueue: rest,
        pendingSearchPreferSize: rest.length > 0 ? context.pendingSearchPreferSize : null,
      },
      sessionPatch: {
        pendingSearchQueue: rest,
        pendingSearchPreferSize: rest.length > 0 ? context.pendingSearchPreferSize : null,
      },
      intent: "search",
    };
  }

  // Multi-product confirm gate
  if (context.pendingMultiProductConfirm) {
    const pending = context.pendingMultiProductConfirm;
    const wantSingle =
      DENY.test(text) ||
      /^(ek|one|single|1)\b/i.test(text) ||
      /\bek\s*(hi\s*)?product\b/i.test(text);
    const wantMulti =
      isAffirm(text) ||
      /^(do|teen|2|3|multi|dono|sab)\b/i.test(text) ||
      /\b(2|do|teen)\s*product/i.test(text);

    if (wantMulti) {
      const [keyword, ...rest] = pending.products;
      return {
        toolCalls: [
          {
            id: nanoid(),
            name: "searchProducts",
            args: {
              keyword,
              limit: 8,
              ...(rest.length > 0 ? { searchQueue: rest } : {}),
            },
          },
        ],
        intent: "search",
      };
    }
    if (wantSingle) {
      return {
        toolCalls: [
          {
            id: nanoid(),
            name: "searchProducts",
            args: {
              keyword: pending.fullPhrase,
              limit: 8,
            },
          },
        ],
        intent: "search",
      };
    }
    const lines = pending.products
      .map((p, i) => `${i + 1}. ${p}`)
      .join("\n");
    return {
      toolCalls: [],
      earlyResult: {
        assistantMessage: hi
          ? `Confirm karo — kya yeh ${pending.products.length} alag products hain?\n${lines}\n"Haan" = aise search.\n"Nahi" = ek hi product: "${pending.fullPhrase}"`
          : `Confirm — are these ${pending.products.length} separate products?\n${lines}\n"Yes" = search that way.\n"No" = one product: "${pending.fullPhrase}"`,
        toolCalls: [],
        toolResults: [],
        contextPatch: {},
        uiAction: null,
      },
      intent: "clarify",
    };
  }

  // Confirmation gate
  if (context.pendingConfirmation) {
    if (isAffirm(text)) {
      const conf = context.pendingConfirmation;
      return {
        toolCalls: [
          {
            id: nanoid(),
            name: conf.toolName,
            args: conf.toolArgs,
          },
        ],
        sessionPatch: {},
        intent: "affirm",
      };
    }
    if (DENY.test(text) || isShoppingDecline(text)) {
      return {
        toolCalls: [],
        earlyResult: {
          assistantMessage: hi
            ? "Theek hai, cancel kar diya. Aur kuch chahiye?"
            : "Cancelled. Want something else?",
          toolCalls: [],
          toolResults: [],
          contextPatch: {
            pendingConfirmation: null,
            pendingQuantity: false,
            selectedProduct: null,
            pendingTool: null,
            pendingAddQuantity: null,
            pendingMultiProductConfirm: null,
          },
          uiAction: null,
        },
        sessionPatch: {},
        intent: "deny",
      };
    }
    // Chitchat / greeting: answer without clearing confirm state
    if (isHeldConversation(text)) {
      const short = buildShortChitchatLine(text, context);
      const resume = resumeWriteGatePrompt(context, hi);
      return {
        toolCalls: [],
        earlyResult: {
          assistantMessage: `${short}\n${resume}`,
          toolCalls: [],
          toolResults: [],
          contextPatch: languagePatch(context, text),
          uiAction: null,
        },
        sessionPatch: {},
        intent: "chitchat",
      };
    }
    if (isShoppingAdvice(text)) {
      const advice = buildShoppingAdviceMessage(text, context);
      const resume = resumeWriteGatePrompt(context, hi);
      return {
        toolCalls: [],
        earlyResult: {
          assistantMessage: `${advice}\n\n${resume}`,
          toolCalls: [],
          toolResults: [],
          contextPatch: languagePatch(context, text),
          uiAction: null,
        },
        sessionPatch: {},
        intent: "advice",
      };
    }
    if (isSoftEscapeIntent(text, context)) {
      const cleared = clearPendingWriteState(context);
      const next = tryHandleDialogueGates(text, cleared);
      const note = hi
        ? "Pehle wala confirm cancel."
        : "Cancelled the previous confirm.";
      
      const clearingPatch = {
        pendingConfirmation: null,
        pendingQuantity: false,
        selectedProduct: null,
        pendingTool: null,
        pendingAddQuantity: null,
      };
      
      if (next && next.earlyResult && next.toolCalls.length === 0) {
        return {
          toolCalls: [],
          earlyResult: {
            ...next.earlyResult,
            assistantMessage: `${note}\n${next.earlyResult.assistantMessage}`,
            contextPatch: {
              ...clearingPatch,
              ...next.earlyResult.contextPatch,
            },
          },
          sessionPatch: {
            ...clearingPatch,
            ...(next.sessionPatch ?? {}),
          },
          intent: next.intent,
        };
      }
      if (next) {
        return {
          ...next,
          sessionPatch: {
            ...clearingPatch,
            ...next.sessionPatch,
          },
          notePrefix: next.notePrefix ? `${note}\n${next.notePrefix}` : note,
        };
      }
      // next is null - fall through to tool planner
      const toolPlanner = require("./toolPlanner");
      const tools = toolPlanner.planToolsFromUtterance(text, cleared);
      return {
        ...tools,
        sessionPatch: {
          ...clearingPatch,
          ...(tools.sessionPatch ?? {}),
        },
        notePrefix: note,
      };
    }
    return {
      toolCalls: [],
      earlyResult: {
        assistantMessage: hi
          ? 'Confirm ke liye "Haan" / "Nahi" bolo — ya naya product / cart command bolo.'
          : 'Say "Yes" / "No" — or a new product / cart command to switch.',
        toolCalls: [],
        toolResults: [],
        contextPatch: {},
        uiAction: null,
      },
      sessionPatch: {},
      intent: "clarify",
    };
  }

  // Quantity gate
  if (context.pendingQuantity && context.selectedProduct) {
    if (DENY.test(text) || isShoppingDecline(text)) {
      return {
        toolCalls: [],
        earlyResult: {
          assistantMessage: hi
            ? "Theek hai, cancel. Aur kuch chahiye?"
            : "Cancelled. Want something else?",
          toolCalls: [],
          toolResults: [],
          contextPatch: {
            ...langPatch,
            pendingConfirmation: null,
            pendingQuantity: false,
            selectedProduct: null,
            pendingTool: null,
            pendingAddQuantity: null,
            pendingProductSelection: false,
            lastAssistantPromptType: "shopping_prompt",
          },
          uiAction: null,
        },
        sessionPatch: {},
        intent: "deny",
      };
    }
    // Chitchat / greeting: answer without clearing quantity state
    if (isHeldConversation(text)) {
      const short = buildShortChitchatLine(text, context);
      const resume = resumeWriteGatePrompt(context, hi);
      return {
        toolCalls: [],
        earlyResult: {
          assistantMessage: `${short}\n${resume}`,
          toolCalls: [],
          toolResults: [],
          contextPatch: languagePatch(context, text),
          uiAction: null,
        },
        sessionPatch: {},
        intent: "chitchat",
      };
    }
    if (isShoppingAdvice(text)) {
      const advice = buildShoppingAdviceMessage(text, context);
      const resume = resumeWriteGatePrompt(context, hi);
      return {
        toolCalls: [],
        earlyResult: {
          assistantMessage: `${advice}\n\n${resume}`,
          toolCalls: [],
          toolResults: [],
          contextPatch: languagePatch(context, text),
          uiAction: null,
        },
        sessionPatch: {},
        intent: "advice",
      };
    }
    if (isSoftEscapeIntent(text, context)) {
      const cleared = clearPendingWriteState(context);
      const next = tryHandleDialogueGates(text, cleared);
      const note = hi
        ? "Quantity skip — pehle wala select cancel."
        : "Skipped quantity — previous selection cancelled.";
      
      const clearingPatch = {
        pendingConfirmation: null,
        pendingQuantity: false,
        selectedProduct: null,
        pendingTool: null,
        pendingAddQuantity: null,
      };
      
      if (next && next.earlyResult && next.toolCalls.length === 0) {
        return {
          toolCalls: [],
          earlyResult: {
            ...next.earlyResult,
            assistantMessage: `${note}\n${next.earlyResult.assistantMessage}`,
            contextPatch: {
              ...clearingPatch,
              ...next.earlyResult.contextPatch,
            },
          },
          sessionPatch: {
            ...clearingPatch,
            ...(next.sessionPatch ?? {}),
          },
          intent: next.intent,
        };
      }
      if (next) {
        return {
          ...next,
          sessionPatch: {
            ...clearingPatch,
            ...next.sessionPatch,
          },
          notePrefix: next.notePrefix ? `${note}\n${next.notePrefix}` : note,
        };
      }
      // next is null - fall through to tool planner
      const toolPlanner = require("./toolPlanner");
      const tools = toolPlanner.planToolsFromUtterance(text, cleared);
      return {
        ...tools,
        sessionPatch: {
          ...clearingPatch,
          ...(tools.sessionPatch ?? {}),
        },
        notePrefix: note,
      };
    }
    const qty = parseQuantity(text);
    if (qty == null) {
      return {
        toolCalls: [],
        earlyResult: {
          assistantMessage: hi
            ? `Quantity number mein batao (1–${maxQtyFor(context.selectedProduct)}) — ya naya product / cart bolo.`
            : `Please reply with a number (1–${maxQtyFor(context.selectedProduct)}) — or a new product / cart command.`,
          toolCalls: [],
          toolResults: [],
          contextPatch: {},
          uiAction: null,
        },
        sessionPatch: {},
        intent: "clarify",
      };
    }
    const maxQ = maxQtyFor(context.selectedProduct);
    if (qty < 1) {
      return {
        toolCalls: [],
        earlyResult: {
          assistantMessage: hi
            ? "Kam se kam 1 quantity chahiye."
            : "Quantity must be at least 1.",
          toolCalls: [],
          toolResults: [],
          contextPatch: {},
          uiAction: null,
        },
        sessionPatch: {},
        intent: "quantity",
      };
    }
    if (qty > maxQ) {
      return {
        toolCalls: [],
        earlyResult: {
          assistantMessage: hi
            ? `Maximum ${maxQ} allowed hai. Kitni quantity?`
            : `Max allowed is ${maxQ}. How many?`,
          toolCalls: [],
          toolResults: [],
          contextPatch: {},
          uiAction: null,
        },
        sessionPatch: {},
        intent: "quantity",
      };
    }
    return {
      toolCalls: [],
      earlyResult: buildAddConfirmation(context.selectedProduct, qty, hi),
      sessionPatch: {},
      intent: "quantity",
    };
  }

  // Greeting
  if (GREETING_ONLY.test(text)) {
    const name = context.customerName ? `, ${context.customerName}` : "";
    const festive =
      /happy\s+(diwali|holi|new\s+year)|shubh\s+(diwali|holi)|merry\s+christmas/i.test(
        text,
      );
    let assistantMessage: string;
    if (festive) {
      assistantMessage = preferHi(context.language, text)
        ? `Shukriya${name}! Aapko bhi shubhkamnayein. Grocery chahiye to product naam bolo.`
        : `Thank you${name}! Same to you. Name a product whenever you want groceries.`;
    } else {
      assistantMessage = preferHi(context.language, text)
        ? `Namaste${name}! Product bolo — jaise "Fortune oil". Phir quantity confirm karke cart mein add karunga.`
        : `Hello${name}! Search a product — e.g. "Fortune oil". I'll ask quantity, then add to cart.`;
    }
    return {
      toolCalls: [],
      earlyResult: {
        assistantMessage,
        toolCalls: [],
        toolResults: [],
        contextPatch: {
          ...languagePatch(context, text),
          lastAssistantPromptType: "shopping_prompt",
        },
        uiAction: null,
      },
      sessionPatch: {},
      intent: "greeting",
    };
  }

  // Declined shopping after we asked what they need ("koi bhi nahi")
  const promptedShop =
    context.lastAssistantPromptType === "shopping_prompt" ||
    context.lastAssistantPromptType === "broad_category" ||
    context.lastAssistantPromptType === "category_list";
  if (
    isShoppingDecline(text) ||
    (promptedShop && isSoftNo(text))
  ) {
    return {
      toolCalls: [],
      earlyResult: {
        assistantMessage: hi
          ? "Theek hai! Jab bhi grocery chahiye ho, product ka naam bata dena."
          : "No problem! Whenever you want groceries, just tell me a product name.",
        toolCalls: [],
        toolResults: [],
        contextPatch: {
          ...langPatch,
          lastAssistantPromptType: null,
          pendingProductSelection: false,
          lastSearchProducts: [],
          lastSearchQuery: null,
          pendingBroadOptions: null,
          pendingBrand: null,
        },
        uiAction: null,
      },
      sessionPatch: {},
      intent: "decline",
    };
  }

  // "What categories do you have?" → numbered list, then category_list selection
  if (isCategoryCatalogQuestion(text)) {
    return {
      toolCalls: [],
      earlyResult: {
        assistantMessage: buildCategoryListMessage(context, hi),
        toolCalls: [],
        toolResults: [],
        contextPatch: {
          ...langPatch,
          lastAssistantPromptType: "category_list",
        },
        uiAction: null,
      },
      sessionPatch: {},
      intent: "clarify",
      confidence: 0.95,
    };
  }

  // Shopping advice / recommendation — never search immediately
  if (isShoppingAdvice(text)) {
    // During write gates: advise briefly, keep shopping state
    if (
      context.pendingConfirmation ||
      (context.pendingQuantity && context.selectedProduct)
    ) {
      const advice = buildShoppingAdviceMessage(text, context);
      const resume = resumeWriteGatePrompt(context, hi);
      return {
        toolCalls: [],
        earlyResult: {
          assistantMessage: `${advice}\n\n${resume}`,
          toolCalls: [],
          toolResults: [],
          contextPatch: languagePatch(context, text),
          uiAction: null,
        },
        sessionPatch: {},
        intent: "advice",
      };
    }
    if (
      context.pendingProductSelection &&
      context.lastSearchProducts.length > 0
    ) {
      const advice = buildShoppingAdviceMessage(text, context);
      const lines = context.lastSearchProducts
        .map((p, i) => formatProductLine(p, i))
        .join("\n");
      return {
        toolCalls: [],
        earlyResult: {
          assistantMessage: hi
            ? `${advice}\n\nYa list se number bolo:\n${lines}`
            : `${advice}\n\nOr pick a number from the list:\n${lines}`,
          toolCalls: [],
          toolResults: [],
          contextPatch: languagePatch(context, text),
          uiAction: null,
          products: context.lastSearchProducts,
        },
        sessionPatch: {},
        intent: "advice",
      };
    }
    return {
      toolCalls: [],
      earlyResult: {
        assistantMessage: buildShoppingAdviceMessage(text, context),
        toolCalls: [],
        toolResults: [],
        contextPatch: {
          ...languagePatch(context, text),
          lastAssistantPromptType: "shopping_prompt",
        },
        uiAction: null,
      },
      sessionPatch: {},
      intent: "advice",
    };
  }

  // Conversation intent (greeting already handled) — never search
  if (isChitchat(text)) {
    // Hold product-selection list instead of dropping into idle shopping nudge
    if (
      context.pendingProductSelection &&
      context.lastSearchProducts.length > 0
    ) {
      const short = buildShortChitchatLine(text, context);
      const lines = context.lastSearchProducts
        .map((p, i) => formatProductLine(p, i))
        .join("\n");
      return {
        toolCalls: [],
        earlyResult: {
          assistantMessage: hi
            ? `${short}\nKaunsa product?\n${lines}`
            : `${short}\nWhich product?\n${lines}`,
          toolCalls: [],
          toolResults: [],
          contextPatch: languagePatch(context, text),
          uiAction: null,
          products: context.lastSearchProducts,
        },
        sessionPatch: {},
        intent: "chitchat",
      };
    }
    const name = context.customerName ? `, ${context.customerName}` : "";
    const t = normalizeChitchatText(text);
    const thanks = /thanks?|thank\s+you|thx|ty|shukriya|dhanyavaad|dhanyavad/i.test(t);
    const bye =
      /bye|goodbye|good\s+night|see\s+you|phir\s+milte\s+hain/i.test(t);
    const who =
      /who\s+are\s+you|tum\s+kaun|aap\s+kaun|what\s+can\s+you|kya\s+kar\s+sakte|kaise\s+kaam|help|madad/i.test(
        t,
      );
    const doing =
      /what\s+(are\s+)?you\s+doing|wyd|kya\s+kar\s+(rahe|rhe)\s+ho/i.test(t);
    let assistantMessage: string;
    let promptType: ConversationContext["lastAssistantPromptType"] =
      "shopping_prompt";
    if (thanks) {
      assistantMessage = preferHi(context.language, text)
        ? `Ji bilkul${name}! Aur kuch chahiye to product naam bolo.`
        : `You're welcome${name}! Tell me a product when you're ready.`;
    } else if (bye) {
      assistantMessage = preferHi(context.language, text)
        ? `Alvida${name}! Jab chahiye Shop Assist pe aa jana.`
        : `Bye${name}! Come back anytime you need groceries.`;
      promptType = null;
    } else if (who) {
      assistantMessage = preferHi(context.language, text)
        ? `Main Shop Assist hoon${name} — grocery search, cart aur checkout mein help karta hoon. Product bolo — jaise "Fortune oil 1 litre" ya "Aashirvaad atta 5 kg".`
        : `I'm Shop Assist${name} — I help search groceries, cart, and checkout. Name a product — e.g. "Fortune oil 1 litre".`;
    } else if (doing) {
      assistantMessage = preferHi(context.language, text)
        ? `Bas aapki grocery shopping mein madad kar raha hoon${name}. Product naam bolo!`
        : `Just waiting to help you shop${name}. Name a product and I'll find it!`;
    } else {
      // how are you / kaise ho aap / kya haal
      assistantMessage = preferHi(context.language, text)
        ? `Main badhiya hoon${name}! Aapko kaunsi grocery chahiye? Product naam bolo — jaise "Fortune oil".`
        : `I'm doing well${name}! What grocery can I get for you? Name a product — e.g. "Fortune oil".`;
    }
    return {
      toolCalls: [],
      earlyResult: {
        assistantMessage,
        toolCalls: [],
        toolResults: [],
        contextPatch: {
          ...languagePatch(context, text),
          lastAssistantPromptType: promptType,
        },
        uiAction: null,
      },
      sessionPatch: {},
      intent: "chitchat",
    };
  }

  // Cart total
  if (CART_TOTAL_HINTS.test(text)) {
    return {
      toolCalls: [
        {
          id: nanoid(),
          name: "getCart",
          args: { mode: "total" },
        },
      ],
      sessionPatch: {},
      intent: "cart_total",
    };
  }

  // Checkout
  if (wantsCheckout(text)) {
    if (!context.customerId) {
      return {
        toolCalls: [
          {
            id: nanoid(),
            name: "openUi",
            args: { action: "OPEN_LOGIN" },
          },
        ],
        sessionPatch: {},
        intent: "checkout",
      };
    }
    return {
      toolCalls: [
        {
          id: nanoid(),
          name: "startCheckout",
          args: {},
        },
      ],
      sessionPatch: {},
      intent: "checkout",
    };
  }

  // Clear cart
  if (CLEAR_CART_HINTS.test(text) && !/\b(add|daal|dal)\b/i.test(text)) {
    const hiClear = preferHi(context.language, text);
    if (context.cartItemCount === 0) {
      return {
        toolCalls: [],
        earlyResult: {
          assistantMessage: hiClear
            ? "Cart pehle se khali hai."
            : "Cart is already empty.",
          toolCalls: [],
          toolResults: [],
          contextPatch: { ...languagePatch(context, text) },
          uiAction: null,
        },
        sessionPatch: {},
        intent: "clear_cart",
      };
    }
    return {
      toolCalls: [],
      earlyResult: {
        assistantMessage: hiClear
          ? `Cart ke ${context.cartItemCount} items clear kar du? Confirm? (Haan / Nahi)`
          : `Clear all ${context.cartItemCount} items from cart? (Yes / No)`,
        toolCalls: [],
        toolResults: [],
        contextPatch: {
          ...languagePatch(context, text),
          pendingConfirmation: {
            title: hiClear ? "Cart clear?" : "Clear cart?",
            summary: {
              Action: hiClear ? "Saari items hatao" : "Remove all items",
              Items: String(context.cartItemCount),
            },
            toolName: "clearCart",
            toolArgs: {},
          },
          pendingTool: "clearCart",
        },
        uiAction: null,
      },
      sessionPatch: {},
      intent: "clear_cart",
    };
  }

  // List cart
  if (LIST_CART_HINTS.test(text) && !/\b(add|daal|dal)\b/i.test(text)) {
    return {
      toolCalls: [
        {
          id: nanoid(),
          name: "getCart",
          args: { mode: "list" },
        },
      ],
      sessionPatch: {},
      intent: "cart_list",
    };
  }

  // Open cart page
  if (OPEN_CART_HINTS.test(text) && !/\b(add|daal|dal)\b/i.test(text)) {
    return {
      toolCalls: [
        {
          id: nanoid(),
          name: "openUi",
          args: { action: "OPEN_CART" },
        },
      ],
      sessionPatch: {},
      intent: "cart_open",
    };
  }

  // More results
  if (MORE_RESULTS_HINTS.test(text) && context.lastSearchQuery) {
    return {
      toolCalls: [
        {
          id: nanoid(),
          name: "openUi",
          args: {
            action: "OPEN_SEARCH_RESULTS",
            query: context.lastSearchQuery,
          },
        },
      ],
      sessionPatch: {},
      intent: "more_results",
    };
  }

  // Product detail
  if (
    DETAIL_HINTS.test(text) &&
    (context.selectedProduct || context.lastSearchProducts.length === 1)
  ) {
    const product =
      context.selectedProduct || context.lastSearchProducts[0];
    return {
      toolCalls: [
        {
          id: nanoid(),
          name: "openUi",
          args: { action: "OPEN_PRODUCT_DETAIL", productId: product._id },
        },
      ],
      sessionPatch: {},
      intent: "product_detail",
    };
  }

  // Product selection from search results
  if (context.pendingProductSelection && context.lastSearchProducts.length > 0) {
    if (DENY.test(text) || isShoppingDecline(text)) {
      return {
        toolCalls: [],
        earlyResult: {
          assistantMessage: hi
            ? "Theek hai, cancel. Aur kuch chahiye?"
            : "Cancelled. Want something else?",
          toolCalls: [],
          toolResults: [],
          contextPatch: {
            ...langPatch,
            pendingProductSelection: false,
            lastSearchProducts: [],
            lastSearchQuery: null,
            pendingTool: null,
            pendingAddQuantity: null,
            pendingBrand: null,
            lastAssistantPromptType: "shopping_prompt",
          },
          uiAction: null,
        },
        sessionPatch: {},
        intent: "deny",
      };
    }
    if (isHeldConversation(text)) {
      const short = buildShortChitchatLine(text, context);
      const lines = context.lastSearchProducts
        .map((p, i) => formatProductLine(p, i))
        .join("\n");
      return {
        toolCalls: [],
        earlyResult: {
          assistantMessage: hi
            ? `${short}\nKaunsa product?\n${lines}`
            : `${short}\nWhich product?\n${lines}`,
          toolCalls: [],
          toolResults: [],
          contextPatch: languagePatch(context, text),
          uiAction: null,
          products: context.lastSearchProducts,
        },
        sessionPatch: {},
        intent: "chitchat",
      };
    }
    const preferQty = context.pendingAddQuantity;
    // Affirm single result
    if (context.lastSearchProducts.length === 1 && isAffirm(text)) {
      return {
        toolCalls: [],
        earlyResult: askQuantityResult(
          context.lastSearchProducts[0],
          hi,
          [],
          preferQty,
        ),
        sessionPatch: {},
        intent: "affirm",
      };
    }

    // Multi-index pick: "5 and 7"
    const multiIdx = parseProductIndices(
      text,
      context.lastSearchProducts.length,
    );
    if (multiIdx.length >= 1) {
      const picked = multiIdx
        .map((i) => context.lastSearchProducts[i])
        .filter(Boolean);
      if (picked.length >= 1) {
        const [first, ...rest] = picked;
        const pickConf = scoreProductPickConfidence({
          matchCount: 1,
          optionCount: context.lastSearchProducts.length,
          usedIndex: true,
        });
        return {
          toolCalls: [],
          earlyResult: askQuantityResult(first, hi, rest, preferQty),
          sessionPatch: {},
          intent: "pick",
          confidence: pickConf,
        };
      }
    }

    const matches = matchPendingProduct(text, context.lastSearchProducts);
    const usedIndex = /^\d+\s*(st|nd|rd|th|number|no\.?)?$/i.test(text.trim());
    const pickConf = scoreProductPickConfidence({
      matchCount: matches.length,
      optionCount: context.lastSearchProducts.length,
      usedIndex,
    });
    if (matches.length === 1 && pickConf >= CONFIDENCE_CLARIFY_THRESHOLD) {
      return {
        toolCalls: [],
        earlyResult: askQuantityResult(matches[0], hi, [], preferQty),
        sessionPatch: {},
        intent: "pick",
        confidence: pickConf,
      };
    }
    if (matches.length > 1 || (matches.length === 1 && pickConf < CONFIDENCE_CLARIFY_THRESHOLD)) {
      const lines = (matches.length > 1 ? matches : context.lastSearchProducts)
        .map((p, i) => formatProductLine(p, i))
        .join("\n");
      return {
        toolCalls: [],
        earlyResult: {
          assistantMessage: hi
            ? `Kai options milen — kaunsa?\n${lines}`
            : `Several matches — which one?\n${lines}`,
          toolCalls: [],
          toolResults: [],
          contextPatch: {
            pendingProductSelection: true,
            lastSearchProducts: matches.length > 1 ? matches : context.lastSearchProducts,
          },
          uiAction: null,
          products: matches.length > 1 ? matches : context.lastSearchProducts,
        },
        sessionPatch: {},
        intent: "clarify",
        confidence: pickConf,
      };
    }
    // No match — fall through to new search
  }

  // No gate matched — fall through to tool planner
  return null;
}
