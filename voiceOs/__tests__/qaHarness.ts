/**
 * Shared QA harness for Shop Assist conversation journeys.
 * Assert transcript + internal state after every step.
 */
import { handleUserMessage } from "@/voiceOs/conversationManager";
import { executeTool } from "@/voiceOs/toolExecutor";
import { createInitialContext, derivePhase } from "@/voiceOs/types";
import type {
  AgentTurnResult,
  ConversationContext,
  ConversationPhase,
  SessionProduct,
  ToolResult,
} from "@/voiceOs/types";

export const oil1l: SessionProduct = {
  _id: "oil1",
  name: "Fortune Kachi Ghani Mustard Oil",
  size: "1 L",
  price: 190,
  discountedPrice: 190,
  isOutOfStock: false,
  maxQuantity: 5,
  image: null,
};

export const oil2l: SessionProduct = {
  _id: "oil2",
  name: "Fortune Sunflower Oil",
  size: "2 L",
  price: 380,
  discountedPrice: 380,
  isOutOfStock: false,
  maxQuantity: 5,
  image: null,
};

export const oil5l: SessionProduct = {
  _id: "oil5",
  name: "Fortune Sunflower Oil",
  size: "5 L",
  price: 750,
  discountedPrice: 750,
  isOutOfStock: false,
  maxQuantity: 5,
  image: null,
};

export const atta: SessionProduct = {
  _id: "atta1",
  name: "Fortune Chakki Fresh Atta",
  size: "5 Kg",
  price: 280,
  discountedPrice: 280,
  isOutOfStock: false,
  maxQuantity: 5,
  image: null,
};

export const sugar: SessionProduct = {
  _id: "sugar1",
  name: "Independence Crystal Sugar",
  size: "1 Kg",
  price: 59,
  discountedPrice: 59,
  isOutOfStock: false,
  maxQuantity: 5,
  image: null,
};

export const turmericPowder: SessionProduct = {
  _id: "haldi1",
  name: "Everest Turmeric Powder",
  size: "100 g",
  price: 45,
  discountedPrice: 45,
  isOutOfStock: false,
  maxQuantity: 5,
  image: null,
};

export const mustardOil: SessionProduct = {
  _id: "mustard1",
  name: "Patanjali Kachi Ghani Mustard Oil",
  size: "1 L",
  price: 215,
  discountedPrice: 215,
  isOutOfStock: false,
  maxQuantity: 5,
  image: null,
};

export type StepAssert = {
  phase?: ConversationPhase;
  pendingQuantity?: boolean;
  pendingConfirmation?: boolean | "defined";
  pendingProductSelection?: boolean;
  pendingBrand?: string | null;
  paymentPending?: boolean;
  selectedProductId?: string | null;
  messageMatch?: RegExp;
  messageNotMatch?: RegExp;
  tools?: string[];
  toolsNot?: string[];
  cartItemCount?: number;
  allowAdd?: boolean;
  /** Assert search keyword when searchProducts ran. */
  searchKeyword?: RegExp;
};

export type ScriptStep = {
  user: string;
  assert?: StepAssert;
};

export const qaDeps = {
  dispatch: jest.fn() as any,
  getState: jest.fn(() => ({
    auth: { token: "test-token" },
  })) as any,
};

export function searchResult(
  keyword: string,
  products: SessionProduct[],
): ToolResult {
  return {
    ok: true,
    toolName: "searchProducts",
    data: {
      keyword,
      resolvedKeyword: keyword,
      count: products.length,
      totalResults: products.length,
      hasMore: false,
      products,
    },
  };
}

export function addResult(
  product: SessionProduct,
  quantity: number,
  cartItemCount?: number,
): ToolResult {
  return {
    ok: true,
    toolName: "addToCart",
    data: {
      name: product.name,
      quantity,
      lineQuantity: quantity,
      cartItemCount: cartItemCount ?? quantity,
      cartItems: [
        {
          productId: product._id,
          name: product.name,
          quantity,
          price: product.discountedPrice ?? product.price ?? 0,
        },
      ],
    },
  };
}

export function mergeSession(
  session: ConversationContext,
  result: AgentTurnResult,
): ConversationContext {
  return createInitialContext({
    ...session,
    ...result.contextPatch,
  });
}

export function loggedInSession(
  partial?: Partial<ConversationContext>,
): ConversationContext {
  return createInitialContext({
    language: "hi",
    customerId: "u1",
    customerName: "Shivam",
    cartItemCount: 0,
    ...partial,
  });
}

/** Default catalog mock for QA journeys. */
export function installDefaultCatalogMock(
  mockedExecute: jest.MockedFunction<typeof executeTool>,
): void {
  mockedExecute.mockImplementation(async (name, args) => {
    if (name === "searchProducts") {
      const kw = String(args.keyword ?? "").toLowerCase();
      const preferSize =
        typeof args.preferSize === "string" ? args.preferSize.toLowerCase() : "";
      if (/turmeric|haldi/.test(kw)) {
        return searchResult(kw, [turmericPowder]);
      }
      if (/atta|aashirvaad|ashirwad/.test(kw)) {
        return searchResult(kw, [atta]);
      }
      if (/sugar|chini/.test(kw)) {
        return searchResult(kw, [sugar]);
      }
      if (/mustard/.test(kw) && !/fortune/.test(kw)) {
        return searchResult(kw, [mustardOil]);
      }
      if (/biscuit/.test(kw)) {
        return searchResult(kw, [
          {
            _id: "bisc1",
            name: "Parle-G Biscuits",
            size: "800 g",
            price: 70,
            discountedPrice: 70,
            isOutOfStock: false,
            maxQuantity: 5,
            image: null,
          },
        ]);
      }
      let oils = [oil1l, oil2l, oil5l];
      if (preferSize.includes("2")) oils = [oil2l];
      else if (preferSize.includes("1")) oils = [oil1l];
      else if (preferSize.includes("5")) oils = [oil5l];
      if (/fortune/.test(kw) || /oil|tel/.test(kw)) {
        return searchResult(kw, oils);
      }
      return searchResult(kw, oils);
    }
    if (name === "addToCart") {
      const productId = String(args.productId ?? "");
      const qty = Number(args.quantity ?? 1);
      const product =
        [oil1l, oil2l, oil5l, atta, sugar, turmericPowder, mustardOil].find(
          (p) => p._id === productId,
        ) ?? oil1l;
      return addResult(product, qty);
    }
    if (name === "startCheckout") {
      return {
        ok: true,
        toolName: "startCheckout",
        data: {
          status: "proceed",
          payableTotal: 400,
          orderDiscount: 0,
        },
      };
    }
    return { ok: true, toolName: name, data: {} };
  });
}

export async function runScript(
  mockedExecute: jest.MockedFunction<typeof executeTool>,
  steps: ScriptStep[],
  initial: ConversationContext = loggedInSession(),
): Promise<ConversationContext> {
  let session = initial;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const assert = step.assert ?? {};
    const beforeCalls = mockedExecute.mock.calls.length;
    const result = await handleUserMessage(step.user, session, qaDeps);
    const turnCalls = mockedExecute.mock.calls.slice(beforeCalls);
    const toolNames = turnCalls.map((c) => c[0] as string);
    session = mergeSession(session, result);
    const phase = derivePhase(session);
    const label = `step ${i + 1} "${step.user}"`;

    if (assert.phase != null) {
      expect({ label, phase }).toEqual({ label, phase: assert.phase });
    }
    if (assert.pendingQuantity != null) {
      expect(session.pendingQuantity).toBe(assert.pendingQuantity);
    }
    if (assert.pendingConfirmation === "defined") {
      expect(session.pendingConfirmation).toBeTruthy();
    } else if (typeof assert.pendingConfirmation === "boolean") {
      expect(!!session.pendingConfirmation).toBe(assert.pendingConfirmation);
    }
    if (assert.pendingProductSelection != null) {
      expect(session.pendingProductSelection).toBe(
        assert.pendingProductSelection,
      );
    }
    if (assert.pendingBrand !== undefined) {
      expect(session.pendingBrand).toBe(assert.pendingBrand);
    }
    if (assert.paymentPending != null) {
      expect(session.paymentPending).toBe(assert.paymentPending);
    }
    if (assert.selectedProductId !== undefined) {
      expect(session.selectedProduct?._id ?? null).toBe(
        assert.selectedProductId,
      );
    }
    if (assert.messageMatch) {
      expect(result.assistantMessage).toMatch(assert.messageMatch);
    }
    if (assert.messageNotMatch) {
      expect(result.assistantMessage).not.toMatch(assert.messageNotMatch);
    }
    if (assert.tools) {
      expect({ label, toolNames }).toEqual({ label, toolNames: assert.tools });
    }
    if (assert.toolsNot) {
      for (const t of assert.toolsNot) {
        expect(toolNames).not.toContain(t);
      }
    }
    if (assert.searchKeyword && toolNames.includes("searchProducts")) {
      const call = turnCalls.find((c) => c[0] === "searchProducts");
      expect(String(call?.[1]?.keyword ?? "")).toMatch(assert.searchKeyword);
    }
    if (!assert.allowAdd) {
      expect(toolNames).not.toContain("addToCart");
    }
    if (assert.cartItemCount != null) {
      expect(session.cartItemCount).toBe(assert.cartItemCount);
    }
  }
  return session;
}
