jest.mock("@/voiceOs/toolExecutor", () => ({
  executeTool: jest.fn(),
}));

jest.mock("@/voiceOs/agent/llmClient", () => ({
  isShopAssistLlmEnabled: jest.fn(() => false),
  callShopAssistLlm: jest.fn(),
}));

import { handleUserMessage } from "@/voiceOs/conversationManager";
import { executeTool } from "@/voiceOs/toolExecutor";
import {
  callShopAssistLlm,
  isShopAssistLlmEnabled,
} from "@/voiceOs/agent/llmClient";
import { mapShopAssistPlanToToolCalls } from "@/voiceOs/agent/shopAssistPlanMap";
import { sanitizeShopAssistPlan } from "@/voiceOs/agent/shopAssistPlanSanitize";
import { createInitialContext } from "@/voiceOs/types";
import type { SessionProduct, ToolResult } from "@/voiceOs/types";

const mockedExecute = executeTool as jest.MockedFunction<typeof executeTool>;
const mockedLlmEnabled = isShopAssistLlmEnabled as jest.MockedFunction<
  typeof isShopAssistLlmEnabled
>;
const mockedCallLlm = callShopAssistLlm as jest.MockedFunction<
  typeof callShopAssistLlm
>;

const sugar: SessionProduct = {
  _id: "sugar1",
  name: "Independence Crystal Sugar",
  size: "1 Kg",
  price: 59,
  discountedPrice: 59,
  isOutOfStock: false,
  maxQuantity: 5,
  image: null,
};

const deps = {
  dispatch: jest.fn() as any,
  getState: jest.fn(() => ({ auth: { token: "test_jwt" } })) as any,
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

describe("sanitizeShopAssistPlan", () => {
  it("parses search and strips fences", () => {
    expect(
      sanitizeShopAssistPlan(
        '```json\n{"action":"search","keyword":"mustard oil","preferSize":"1l","preferQty":2}\n```',
      ),
    ).toMatchObject({
      action: "search",
      keyword: "mustard oil",
      preferSize: "1l",
      preferQty: 2,
    });
  });

  it("invalid JSON → none", () => {
    expect(sanitizeShopAssistPlan("lol").action).toBe("none");
  });
});

describe("mapShopAssistPlanToToolCalls", () => {
  it("maps search to searchProducts with size/qty", () => {
    const { toolCalls } = mapShopAssistPlanToToolCalls({
      action: "search",
      keyword: "fortune oil",
      preferSize: "1l",
      preferQty: 3,
    });
    expect(toolCalls[0]).toMatchObject({
      name: "searchProducts",
      args: {
        keyword: "fortune oil",
        preferSize: "1l",
        intent: "add",
        preferQty: 3,
      },
    });
  });

  it("never maps to addToCart", () => {
    const { toolCalls } = mapShopAssistPlanToToolCalls({
      action: "search",
      keyword: "sugar",
      preferQty: 1,
    });
    expect(toolCalls.every((c) => c.name !== "addToCart")).toBe(true);
  });

  it("ask returns message only", () => {
    const mapped = mapShopAssistPlanToToolCalls({
      action: "ask",
      message: "Kaunsa oil?",
    });
    expect(mapped.toolCalls).toHaveLength(0);
    expect(mapped.assistantMessage).toMatch(/Kaunsa oil/);
  });
});

describe("conversationManager HF fallback", () => {
  beforeEach(() => {
    mockedExecute.mockReset();
    mockedCallLlm.mockReset();
    mockedLlmEnabled.mockReturnValue(false);
  });

  it("does not call HF when local understands the utterance", async () => {
    mockedLlmEnabled.mockReturnValue(true);
    mockedExecute.mockResolvedValueOnce(searchResult("sugar", [sugar]));

    await handleUserMessage("sugar", createInitialContext(), deps);

    expect(mockedCallLlm).not.toHaveBeenCalled();
    expect(mockedExecute).toHaveBeenCalledTimes(1);
  });

  it("calls HF on unclear local turn when flag enabled", async () => {
    mockedLlmEnabled.mockReturnValue(true);
    mockedCallLlm.mockResolvedValueOnce({
      action: "search",
      keyword: "fortune mustard oil",
      preferSize: "1l",
      preferQty: 1,
    });
    mockedExecute.mockResolvedValueOnce(
      searchResult("fortune mustard oil", [sugar]),
    );

    const result = await handleUserMessage(
      "?",
      createInitialContext({ language: "hi" }),
      deps,
    );

    expect(mockedCallLlm).toHaveBeenCalledTimes(1);
    expect(mockedExecute).toHaveBeenCalledWith(
      "searchProducts",
      expect.objectContaining({
        keyword: "fortune mustard oil",
        preferSize: "1l",
      }),
      expect.anything(),
    );
    expect(result.toolCalls.some((c) => c.name === "searchProducts")).toBe(
      true,
    );
  });

  it("does not call HF when flag disabled even if unclear", async () => {
    mockedLlmEnabled.mockReturnValue(false);
    const result = await handleUserMessage(
      "?",
      createInitialContext({ language: "hi" }),
      deps,
    );
    expect(mockedCallLlm).not.toHaveBeenCalled();
    expect(result.assistantMessage).toMatch(/Samajh nahi|didn't catch/i);
  });

  it("HF ask returns clarifying message without tools", async () => {
    mockedLlmEnabled.mockReturnValue(true);
    mockedCallLlm.mockResolvedValueOnce({
      action: "ask",
      message: "Kaunsa Fortune oil — mustard ya sunflower?",
    });

    const result = await handleUserMessage(
      "?",
      createInitialContext({ language: "hi" }),
      deps,
    );

    expect(mockedExecute).not.toHaveBeenCalled();
    expect(result.assistantMessage).toMatch(/mustard|sunflower/i);
  });

  it("calls HF on weak default search (chitchat-shaped) and skips catalog", async () => {
    mockedLlmEnabled.mockReturnValue(true);
    mockedCallLlm.mockResolvedValueOnce({
      action: "ask",
      message: "Just here to help you shop — name a product!",
    });

    // Not shopping and not allowlisted → local clarify → LLM classifies
    const result = await handleUserMessage(
      "what's the weather like?",
      createInitialContext({ language: "en" }),
      deps,
    );

    expect(mockedCallLlm).toHaveBeenCalledTimes(1);
    expect(mockedExecute).not.toHaveBeenCalled();
    expect(result.assistantMessage).toMatch(/shop|product/i);
    expect(result.assistantMessage).not.toMatch(/Found top|options/i);
  });

  it("does not call HF for clear grocery searches", async () => {
    mockedLlmEnabled.mockReturnValue(true);
    mockedExecute.mockResolvedValueOnce(searchResult("sugar", [sugar]));

    await handleUserMessage("sugar", createInitialContext(), deps);

    expect(mockedCallLlm).not.toHaveBeenCalled();
    expect(mockedExecute).toHaveBeenCalledTimes(1);
  });

  it("does not call HF during pending confirmation", async () => {
    mockedLlmEnabled.mockReturnValue(true);
    const result = await handleUserMessage(
      "?",
      createInitialContext({
        pendingConfirmation: {
          title: "Add?",
          summary: {},
          toolName: "addToCart",
          toolArgs: { productId: "x", quantity: 1 },
        },
      }),
      deps,
    );
    expect(mockedCallLlm).not.toHaveBeenCalled();
    expect(result.assistantMessage).toMatch(/Haan|Yes/i);
  });
});
