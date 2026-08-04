/**
 * Conversation regression suite — CI gate for Shop Assist dialogue.
 *
 * Asserts both user-visible replies and internal conversation state
 * (phase, pending flags), plus negative checks (no accidental search /
 * cart writes).
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

jest.mock("@/voiceOs/toolExecutor", () => ({
  executeTool: jest.fn(),
}));

jest.mock("@/voiceOs/agent/llmClient", () => ({
  isShopAssistLlmEnabled: () => false,
  callShopAssistLlm: jest.fn(),
}));

const mockedExecute = executeTool as jest.MockedFunction<typeof executeTool>;

const oil1l: SessionProduct = {
  _id: "oil1",
  name: "Fortune Kachi Ghani Mustard Oil",
  size: "1 L",
  price: 190,
  discountedPrice: 190,
  isOutOfStock: false,
  maxQuantity: 5,
  image: null,
};

const oil5l: SessionProduct = {
  _id: "oil5",
  name: "Fortune Sunflower Oil",
  size: "5 L",
  price: 750,
  discountedPrice: 750,
  isOutOfStock: false,
  maxQuantity: 5,
  image: null,
};

const atta: SessionProduct = {
  _id: "atta1",
  name: "Fortune Chakki Fresh Atta",
  size: "5 Kg",
  price: 280,
  discountedPrice: 280,
  isOutOfStock: false,
  maxQuantity: 5,
  image: null,
};

const deps = {
  dispatch: jest.fn() as any,
  getState: jest.fn(() => ({
    auth: { token: "test-token" },
  })) as any,
};

function searchResult(
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

function addResult(product: SessionProduct, quantity: number): ToolResult {
  return {
    ok: true,
    toolName: "addToCart",
    data: {
      name: product.name,
      quantity,
      lineQuantity: quantity,
      cartItemCount: quantity,
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

type StepAssert = {
  /** Expected FSM phase after the turn (from merged context). */
  phase?: ConversationPhase;
  pendingQuantity?: boolean;
  pendingConfirmation?: boolean | "defined";
  pendingProductSelection?: boolean;
  selectedProductId?: string | null;
  messageMatch?: RegExp;
  messageNotMatch?: RegExp;
  /** Tool names executed this turn (empty = none). */
  tools?: string[];
  /** Tools that must NOT run this turn. */
  toolsNot?: string[];
  cartItemCount?: number;
  /** Only confirm→add turns may execute addToCart. */
  allowAdd?: boolean;
};

type ScriptStep = {
  user: string;
  assert: StepAssert;
};

function mergeSession(
  session: ConversationContext,
  result: AgentTurnResult,
): ConversationContext {
  return createInitialContext({
    ...session,
    ...result.contextPatch,
  });
}

async function runScript(
  steps: ScriptStep[],
  initial: ConversationContext = createInitialContext({
    language: "hi",
    customerId: "u1",
    customerName: "Shivam",
  }),
): Promise<ConversationContext> {
  let session = initial;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const beforeCalls = mockedExecute.mock.calls.length;
    const result = await handleUserMessage(step.user, session, deps);
    const turnCalls = mockedExecute.mock.calls.slice(beforeCalls);
    const toolNames = turnCalls.map((c) => c[0] as string);
    session = mergeSession(session, result);
    const phase = derivePhase(session);
    const label = `step ${i + 1} "${step.user}"`;

    if (step.assert.phase != null) {
      expect({ label, phase }).toEqual({ label, phase: step.assert.phase });
    }
    if (step.assert.pendingQuantity != null) {
      expect({ label, pendingQuantity: session.pendingQuantity }).toEqual({
        label,
        pendingQuantity: step.assert.pendingQuantity,
      });
    }
    if (step.assert.pendingConfirmation === "defined") {
      expect(session.pendingConfirmation).toBeTruthy();
    } else if (typeof step.assert.pendingConfirmation === "boolean") {
      expect(!!session.pendingConfirmation).toBe(step.assert.pendingConfirmation);
    }
    if (step.assert.pendingProductSelection != null) {
      expect(session.pendingProductSelection).toBe(
        step.assert.pendingProductSelection,
      );
    }
    if (step.assert.selectedProductId !== undefined) {
      expect(session.selectedProduct?._id ?? null).toBe(
        step.assert.selectedProductId,
      );
    }
    if (step.assert.messageMatch) {
      expect(result.assistantMessage).toMatch(step.assert.messageMatch);
    }
    if (step.assert.messageNotMatch) {
      expect(result.assistantMessage).not.toMatch(step.assert.messageNotMatch);
    }
    if (step.assert.tools) {
      expect({ label, toolNames }).toEqual({
        label,
        toolNames: step.assert.tools,
      });
    }
    if (step.assert.toolsNot) {
      for (const t of step.assert.toolsNot) {
        expect(toolNames).not.toContain(t);
      }
    }
    // Invariants every step — no accidental cart writes unless explicitly allowed
    if (!step.assert.allowAdd) {
      expect(toolNames).not.toContain("addToCart");
    }
    if (step.assert.cartItemCount != null) {
      expect(session.cartItemCount).toBe(step.assert.cartItemCount);
    }
  }
  return session;
}

describe("conversationRegression", () => {
  beforeEach(() => {
    mockedExecute.mockReset();
    mockedExecute.mockImplementation(async (name, args) => {
      if (name === "searchProducts") {
        const kw = String(args.keyword ?? "").toLowerCase();
        if (/atta/.test(kw)) return searchResult(kw, [atta]);
        return searchResult(kw, [oil1l, oil5l]);
      }
      if (name === "addToCart") {
        const productId = String(args.productId ?? "");
        const qty = Number(args.quantity ?? 1);
        const product =
          [oil1l, oil5l, atta].find((p) => p._id === productId) ?? oil1l;
        return addResult(product, qty);
      }
      return {
        ok: true,
        toolName: name,
        data: {},
      };
    });
  });

  it("golden path: search → pick → qty → confirm → add", async () => {
    // Special: last step may call addToCart — override per-step invariant via direct asserts
    let session = createInitialContext({
      language: "hi",
      customerId: "u1",
      customerName: "Shivam",
    });

    const steps: Array<{
      user: string;
      assert: StepAssert & { allowAdd?: boolean };
    }> = [
      {
        user: "Fortune oil",
        assert: {
          phase: "awaiting_product_selection",
          pendingProductSelection: true,
          tools: ["searchProducts"],
          messageMatch: /Fortune|options|Kaunsa|Found|Mil/i,
          messageNotMatch: /Samajh nahi/i,
        },
      },
      {
        user: "1",
        assert: {
          phase: "awaiting_qty",
          pendingQuantity: true,
          pendingProductSelection: false,
          selectedProductId: "oil1",
          tools: [],
          toolsNot: ["searchProducts", "addToCart"],
          messageMatch: /quantity|Kitni/i,
        },
      },
      {
        user: "2",
        assert: {
          phase: "awaiting_confirmation",
          pendingQuantity: false,
          pendingConfirmation: "defined",
          selectedProductId: "oil1",
          tools: [],
          toolsNot: ["searchProducts", "addToCart"],
          messageMatch: /Confirm|Haan|Yes/i,
        },
      },
      {
        user: "haan",
        assert: {
          phase: "idle",
          pendingConfirmation: false,
          pendingQuantity: false,
          tools: ["addToCart"],
          allowAdd: true,
          messageMatch: /add|cart|Cart/i,
          cartItemCount: 2,
        },
      },
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const beforeCalls = mockedExecute.mock.calls.length;
      const result = await handleUserMessage(step.user, session, deps);
      const toolNames = mockedExecute.mock.calls
        .slice(beforeCalls)
        .map((c) => c[0] as string);
      session = mergeSession(session, result);
      const phase = derivePhase(session);
      const label = `golden ${i + 1} "${step.user}"`;

      expect({ label, phase }).toEqual({ label, phase: step.assert.phase });
      if (step.assert.pendingQuantity != null) {
        expect(session.pendingQuantity).toBe(step.assert.pendingQuantity);
      }
      if (step.assert.pendingConfirmation === "defined") {
        expect(session.pendingConfirmation).toBeTruthy();
      } else if (typeof step.assert.pendingConfirmation === "boolean") {
        expect(!!session.pendingConfirmation).toBe(
          step.assert.pendingConfirmation,
        );
      }
      if (step.assert.pendingProductSelection != null) {
        expect(session.pendingProductSelection).toBe(
          step.assert.pendingProductSelection,
        );
      }
      if (step.assert.selectedProductId !== undefined) {
        expect(session.selectedProduct?._id ?? null).toBe(
          step.assert.selectedProductId,
        );
      }
      if (step.assert.messageMatch) {
        expect(result.assistantMessage).toMatch(step.assert.messageMatch);
      }
      if (step.assert.messageNotMatch) {
        expect(result.assistantMessage).not.toMatch(
          step.assert.messageNotMatch,
        );
      }
      expect({ label, toolNames }).toEqual({
        label,
        toolNames: step.assert.tools ?? [],
      });
      if (!step.assert.allowAdd) {
        expect(toolNames).not.toContain("addToCart");
      }
      if (step.assert.cartItemCount != null) {
        expect(session.cartItemCount).toBe(step.assert.cartItemCount);
      }
    }
  });

  it("conversation-only: never searches", async () => {
    await runScript([
      {
        user: "hi",
        assert: {
          phase: "idle",
          tools: [],
          toolsNot: ["searchProducts", "addToCart"],
          messageNotMatch: /Found top|Mil gaya/i,
        },
      },
      {
        user: "how are you?",
        assert: {
          phase: "idle",
          tools: [],
          toolsNot: ["searchProducts"],
          messageMatch: /badhiya|well|doing/i,
          messageNotMatch: /Found top/i,
        },
      },
      {
        user: "ho r u",
        assert: {
          tools: [],
          toolsNot: ["searchProducts"],
          messageNotMatch: /Found top/i,
        },
      },
      {
        user: "hw r u",
        assert: {
          tools: [],
          toolsNot: ["searchProducts"],
        },
      },
      {
        user: "kaise ho aap",
        assert: {
          tools: [],
          toolsNot: ["searchProducts"],
          messageMatch: /badhiya|Main/i,
        },
      },
      {
        user: "thanks",
        assert: {
          tools: [],
          toolsNot: ["searchProducts", "addToCart"],
        },
      },
      {
        user: "bye",
        assert: {
          tools: [],
          toolsNot: ["searchProducts", "addToCart"],
          messageMatch: /Alvida|Bye/i,
        },
      },
    ]);
  });

  it("decline after shopping prompt never searches", async () => {
    await runScript([
      {
        user: "namaste",
        assert: {
          tools: [],
          toolsNot: ["searchProducts"],
        },
      },
      {
        user: "koi bhi nhi",
        assert: {
          phase: "idle",
          tools: [],
          toolsNot: ["searchProducts"],
          messageMatch: /Theek hai|Jab bhi|No problem/i,
          messageNotMatch: /Samajh nahi|Found/i,
        },
      },
      {
        user: "hi",
        assert: { tools: [], toolsNot: ["searchProducts"] },
      },
      {
        user: "I don't need anything",
        assert: {
          tools: [],
          toolsNot: ["searchProducts"],
          messageMatch: /Theek|problem|Jab bhi|Whenever/i,
        },
      },
    ]);
  });

  it("interrupt confirm with chitchat then haan still adds", async () => {
    let session = createInitialContext({
      language: "hi",
      customerId: "u1",
      customerName: "Shivam",
    });

    const advance = async (
      user: string,
      assert: StepAssert & { allowAdd?: boolean },
    ) => {
      const before = mockedExecute.mock.calls.length;
      const result = await handleUserMessage(user, session, deps);
      const toolNames = mockedExecute.mock.calls
        .slice(before)
        .map((c) => c[0] as string);
      session = mergeSession(session, result);
      if (assert.phase) expect(derivePhase(session)).toBe(assert.phase);
      if (assert.pendingQuantity != null) {
        expect(session.pendingQuantity).toBe(assert.pendingQuantity);
      }
      if (assert.pendingConfirmation === "defined") {
        expect(session.pendingConfirmation).toBeTruthy();
      } else if (typeof assert.pendingConfirmation === "boolean") {
        expect(!!session.pendingConfirmation).toBe(assert.pendingConfirmation);
      }
      if (assert.selectedProductId !== undefined) {
        expect(session.selectedProduct?._id ?? null).toBe(
          assert.selectedProductId,
        );
      }
      if (assert.messageMatch) {
        expect(result.assistantMessage).toMatch(assert.messageMatch);
      }
      if (assert.tools) expect(toolNames).toEqual(assert.tools);
      if (assert.toolsNot) {
        for (const t of assert.toolsNot) expect(toolNames).not.toContain(t);
      }
      if (!assert.allowAdd) expect(toolNames).not.toContain("addToCart");
      return result;
    };

    await advance("Fortune oil", {
      phase: "awaiting_product_selection",
      tools: ["searchProducts"],
    });
    await advance("1", {
      phase: "awaiting_qty",
      pendingQuantity: true,
      selectedProductId: "oil1",
      tools: [],
      toolsNot: ["searchProducts"],
    });
    await advance("2", {
      phase: "awaiting_confirmation",
      pendingConfirmation: "defined",
      selectedProductId: "oil1",
      tools: [],
      toolsNot: ["searchProducts", "addToCart"],
    });
    // Chitchat must NOT clear confirm
    await advance("How are you?", {
      phase: "awaiting_confirmation",
      pendingConfirmation: "defined",
      selectedProductId: "oil1",
      tools: [],
      toolsNot: ["searchProducts", "addToCart"],
      messageMatch: /badhiya|well|Confirm/i,
    });
    await advance("haan", {
      phase: "idle",
      pendingConfirmation: false,
      tools: ["addToCart"],
      allowAdd: true,
    });
    expect(session.cartItemCount).toBe(2);
    expect(session.pendingConfirmation).toBeNull();
  });

  it("interrupt qty with chitchat preserves pending quantity", async () => {
    await runScript([
      {
        user: "Fortune oil",
        assert: {
          phase: "awaiting_product_selection",
          tools: ["searchProducts"],
        },
      },
      {
        user: "1",
        assert: {
          phase: "awaiting_qty",
          pendingQuantity: true,
          selectedProductId: "oil1",
          tools: [],
        },
      },
      {
        user: "how are you?",
        assert: {
          phase: "awaiting_qty",
          pendingQuantity: true,
          selectedProductId: "oil1",
          tools: [],
          toolsNot: ["searchProducts", "addToCart"],
          messageMatch: /quantity|Kitni|How many/i,
          messageNotMatch: /Found top|cancel|Skipped quantity/i,
        },
      },
      {
        user: "kaise ho",
        assert: {
          phase: "awaiting_qty",
          pendingQuantity: true,
          selectedProductId: "oil1",
          tools: [],
          toolsNot: ["searchProducts"],
        },
      },
    ]);
  });

  it("cancel confirm then chitchat then fresh search", async () => {
    let session = createInitialContext({
      language: "hi",
      customerId: "u1",
      customerName: "Shivam",
    });

    const advance = async (user: string) => {
      const result = await handleUserMessage(user, session, deps);
      session = mergeSession(session, result);
      return result;
    };

    await advance("Fortune oil");
    await advance("1");
    await advance("2");
    expect(derivePhase(session)).toBe("awaiting_confirmation");

    const cancelled = await advance("cancel");
    expect(cancelled.assistantMessage).toMatch(/cancel|Theek hai/i);
    expect(derivePhase(session)).toBe("idle");
    expect(session.pendingConfirmation).toBeNull();
    expect(session.pendingQuantity).toBe(false);
    expect(session.selectedProduct).toBeNull();

    const chat = await advance("How are you?");
    expect(chat.toolCalls).toHaveLength(0);
    expect(chat.assistantMessage).not.toMatch(/Found top/i);
    expect(derivePhase(session)).toBe("idle");

    const before = mockedExecute.mock.calls.length;
    await advance("Fortune atta");
    const newTools = mockedExecute.mock.calls
      .slice(before)
      .map((c) => c[0] as string);
    expect(newTools).toEqual(["searchProducts"]);
    expect(derivePhase(session)).toBe("awaiting_product_selection");
    expect(session.lastSearchProducts.some((p) => /atta/i.test(p.name))).toBe(
      true,
    );
  });

  it("mixed conversation + shopping interleave", async () => {
    let session = createInitialContext({
      language: "hi",
      customerId: "u1",
      customerName: "Shivam",
    });

    const advance = async (
      user: string,
      assert: StepAssert & { allowAdd?: boolean },
    ) => {
      const before = mockedExecute.mock.calls.length;
      const result = await handleUserMessage(user, session, deps);
      const toolNames = mockedExecute.mock.calls
        .slice(before)
        .map((c) => c[0] as string);
      session = mergeSession(session, result);
      if (assert.phase) expect(derivePhase(session)).toBe(assert.phase);
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
      if (assert.tools) expect(toolNames).toEqual(assert.tools);
      if (assert.toolsNot) {
        for (const t of assert.toolsNot) expect(toolNames).not.toContain(t);
      }
      if (!assert.allowAdd) expect(toolNames).not.toContain("addToCart");
      if (assert.messageMatch) {
        expect(result.assistantMessage).toMatch(assert.messageMatch);
      }
      if (assert.messageNotMatch) {
        expect(result.assistantMessage).not.toMatch(assert.messageNotMatch);
      }
    };

    await advance("Hi", {
      phase: "idle",
      tools: [],
      toolsNot: ["searchProducts"],
    });
    await advance("Fortune oil", {
      phase: "awaiting_product_selection",
      pendingProductSelection: true,
      tools: ["searchProducts"],
    });
    // Chitchat during selection — list must remain
    await advance("How are you?", {
      phase: "awaiting_product_selection",
      pendingProductSelection: true,
      tools: [],
      toolsNot: ["searchProducts", "addToCart"],
      messageNotMatch: /Found top/i,
    });
    await advance("2", {
      phase: "awaiting_qty",
      pendingQuantity: true,
      selectedProductId: "oil5",
      tools: [],
      toolsNot: ["searchProducts"],
    });
    await advance("Thanks", {
      phase: "awaiting_qty",
      pendingQuantity: true,
      selectedProductId: "oil5",
      tools: [],
      toolsNot: ["searchProducts", "addToCart"],
      messageMatch: /bilkul|welcome|quantity|Kitni|How many/i,
    });
    await advance("1", {
      phase: "awaiting_confirmation",
      pendingConfirmation: "defined",
      tools: [],
      toolsNot: ["addToCart"],
    });
    await advance("haan", {
      phase: "idle",
      pendingConfirmation: false,
      tools: ["addToCart"],
      allowAdd: true,
    });
    expect(session.cartItemCount).toBe(1);
    await advance("Bye", {
      phase: "idle",
      tools: [],
      toolsNot: ["searchProducts", "addToCart"],
      messageMatch: /Alvida|Bye/i,
    });
  });

  it("soft-escape to new product still clears write gate", async () => {
    await runScript([
      {
        user: "Fortune oil",
        assert: {
          phase: "awaiting_product_selection",
          tools: ["searchProducts"],
        },
      },
      {
        user: "1",
        assert: {
          phase: "awaiting_qty",
          pendingQuantity: true,
          tools: [],
        },
      },
      {
        user: "Fortune atta",
        assert: {
          phase: "awaiting_product_selection",
          pendingQuantity: false,
          pendingConfirmation: false,
          selectedProductId: null,
          tools: ["searchProducts"],
          messageMatch: /atta|Fortune|options|Kaunsa|Found|Mil/i,
        },
      },
    ]);
  });
});
