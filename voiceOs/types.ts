export type VoiceLanguage = "hi" | "en" | "auto";

export type ChatRole = "user" | "assistant" | "system" | "tool";

/**
 * FSM phase — derived from pending flags via derivePhase; kept in sync on patches.
 */
export type ConversationPhase =
  | "idle"
  | "awaiting_product_selection"
  | "awaiting_qty"
  | "awaiting_confirmation"
  | "awaiting_multi_product_confirm"
  | "continuing_search_queue"
  | "checkout"
  | "payment";

/**
 * What the assistant last asked — for contextual replies like "koi bhi nahi".
 */
export type AssistantPromptType =
  | "shopping_prompt"
  | "broad_category"
  | "category_list"
  | "product_selection"
  | "quantity"
  | "confirmation"
  | "yes_no"
  | null;

/** Shop Assist intent labels for TurnPlan / analytics. */
export type ShopIntent =
  | "buy"
  | "search"
  | "chitchat"
  | "greeting"
  | "affirm"
  | "deny"
  | "pick"
  | "quantity"
  | "checkout"
  | "cart_list"
  | "cart_total"
  | "cart_open"
  | "clear_cart"
  | "remove_cart"
  | "more_results"
  | "product_detail"
  | "clarify"
  | "decline"
  | "advice"
  | "unknown";

export type UiAction =
  | { action: "OPEN_SEARCH_RESULTS"; query: string }
  | { action: "OPEN_PRODUCT_DETAIL"; productId: string }
  | { action: "OPEN_CART" }
  | { action: "OPEN_MAP_PICKER" }
  | { action: "OPEN_PAYMENT" }
  | { action: "OPEN_LOGIN" };

export type ConfirmationPayload = {
  title: string;
  summary: Record<string, string>;
  toolName: string;
  toolArgs: Record<string, unknown>;
};

export type SessionProduct = {
  _id: string;
  name: string;
  size?: string | null;
  price?: number | null;
  discountedPrice?: number | null;
  isOutOfStock?: boolean;
  maxQuantity?: number | null;
  image?: string | null;
};

export type CartContextItem = {
  productId: string;
  name?: string;
  quantity: number;
  unitPrice?: number | null;
  lineTotal?: number | null;
};

export type ToolCall = {
  id: string;
  name: string;
  args: Record<string, unknown>;
};

/**
 * Explicit plan for one user turn — inspectable, loggable, testable.
 * Tools are still executed by conversationManager / toolExecutor.
 */
export type TurnPlan = {
  intent: ShopIntent;
  confidence?: number;
  tools: ToolCall[];
  clarify?: string;
  phaseAfter?: ConversationPhase;
  /** Why LLM / clarify path was taken, if any. */
  fallbackReason?: string | null;
};

export type ConversationContext = {
  business: string;
  customerId: string | null;
  customerName: string | null;
  language: VoiceLanguage;
  cartItemCount: number;
  cartItems: CartContextItem[];
  addressSelected: boolean;
  paymentPending: boolean;
  currentScreen: string | null;
  phase: ConversationPhase;
  pendingConfirmation: ConfirmationPayload | null;
  pendingTool: string | null;
  lastSearchQuery: string | null;
  lastSearchProducts: SessionProduct[];
  pendingProductSelection: boolean;
  selectedProduct: SessionProduct | null;
  pendingQuantity: boolean;
  pendingAddQuantity: number | null;
  pendingProductQueue: SessionProduct[];
  pendingSearchQueue: string[];
  pendingSearchPreferSize: string | null;
  pendingMultiProductConfirm: {
    products: string[];
    fullPhrase: string;
  } | null;
  /** Last question the assistant asked (for contextual declines, etc.). */
  lastAssistantPromptType: AssistantPromptType;
  /** Options offered for a broad-category clarify (e.g. powder types). */
  pendingBroadOptions: string[] | null;
  /** Brand waiting for category follow-up (e.g. "Fortune" → "oil"). */
  pendingBrand: string | null;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  toolName?: string;
  toolCallId?: string;
  uiAction?: UiAction | null;
  products?: SessionProduct[];
};

export type ToolResult = {
  ok: boolean;
  toolName: string;
  data?: unknown;
  error?: string;
};

export type AgentTurnResult = {
  assistantMessage: string;
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  contextPatch: Partial<ConversationContext>;
  uiAction: UiAction | null;
  products?: SessionProduct[];
  turnPlan?: TurnPlan;
};

export type TurnAnalyticsEvent = {
  intent: ShopIntent | string;
  phaseBefore: ConversationPhase | string;
  phaseAfter: ConversationPhase | string;
  llmUsed: boolean;
  fallbackReason: string | null;
  toolNames: string[];
  latencyMs: number;
  success: boolean;
  confidence?: number | null;
};

export const DEFAULT_BUSINESS = "Ramnath Pansari";
export const DEFAULT_MAX_CART_QTY = 5;

/** Derive FSM phase from legacy pending flags (source of truth during shim). */
export function derivePhase(ctx: ConversationContext): ConversationPhase {
  if (ctx.paymentPending) return "payment";
  if (ctx.pendingConfirmation) return "awaiting_confirmation";
  if (ctx.pendingQuantity && ctx.selectedProduct) return "awaiting_qty";
  if (ctx.pendingMultiProductConfirm) {
    return "awaiting_multi_product_confirm";
  }
  if (
    ctx.pendingTool === "continueSearchQueue" &&
    (ctx.pendingSearchQueue?.length ?? 0) > 0
  ) {
    return "continuing_search_queue";
  }
  if (ctx.pendingProductSelection) return "awaiting_product_selection";
  return "idle";
}

export function createInitialContext(
  partial?: Partial<ConversationContext>,
): ConversationContext {
  const base: ConversationContext = {
    business: DEFAULT_BUSINESS,
    customerId: null,
    customerName: null,
    language: "auto",
    cartItemCount: 0,
    cartItems: [],
    addressSelected: false,
    paymentPending: false,
    currentScreen: null,
    phase: "idle",
    pendingConfirmation: null,
    pendingTool: null,
    lastSearchQuery: null,
    lastSearchProducts: [],
    pendingProductSelection: false,
    selectedProduct: null,
    pendingQuantity: false,
    pendingAddQuantity: null,
    pendingProductQueue: [],
    pendingSearchQueue: [],
    pendingSearchPreferSize: null,
    pendingMultiProductConfirm: null,
    lastAssistantPromptType: null,
    pendingBroadOptions: null,
    pendingBrand: null,
    ...partial,
  };
  base.phase = derivePhase(base);
  return base;
}
