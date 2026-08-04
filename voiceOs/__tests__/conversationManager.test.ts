import { handleUserMessage } from "@/voiceOs/conversationManager";
import { executeTool } from "@/voiceOs/toolExecutor";
import { createInitialContext } from "@/voiceOs/types";
import type { SessionProduct, ToolResult } from "@/voiceOs/types";

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
  getState: jest.fn(() => ({})) as any,
};

function searchResult(
  keyword: string,
  products: SessionProduct[],
  extras: Partial<{ totalResults: number; hasMore: boolean; count: number }> = {},
): ToolResult {
  return {
    ok: true,
    toolName: "searchProducts",
    data: {
      keyword,
      resolvedKeyword: keyword,
      count: extras.count ?? products.length,
      totalResults: extras.totalResults ?? products.length,
      hasMore: extras.hasMore ?? false,
      products,
    },
  };
}

describe("conversationManager handleUserMessage", () => {
  beforeEach(() => {
    mockedExecute.mockReset();
  });

  it("early-returns without tools for greeting", async () => {
    const result = await handleUserMessage(
      "namaste",
      createInitialContext({ customerName: "Shivam" }),
      deps,
    );
    expect(mockedExecute).not.toHaveBeenCalled();
    expect(result.assistantMessage).toMatch(/Namaste.*Shivam/i);
    expect(result.toolCalls).toHaveLength(0);
  });

  it("runs searchProducts for a simple product query", async () => {
    mockedExecute.mockResolvedValueOnce(searchResult("sugar", [sugar]));

    const result = await handleUserMessage(
      "sugar",
      createInitialContext({ language: "en" }),
      deps,
    );

    expect(mockedExecute).toHaveBeenCalledTimes(1);
    expect(mockedExecute.mock.calls[0][0]).toBe("searchProducts");
    expect(String(mockedExecute.mock.calls[0][1].keyword)).toMatch(/sugar/i);
    expect(result.contextPatch.pendingProductSelection).toBe(true);
    expect(result.assistantMessage).toMatch(/Found|Mil gaya|options|Kaunsa/i);
  });

  it("auto-continues empty search to oil leg WITH preferSize 1l", async () => {
    mockedExecute
      .mockResolvedValueOnce(
        searchResult("chini", [], { count: 0, totalResults: 0 }),
      )
      .mockResolvedValueOnce(
        searchResult("sarso tel", [oil1l], { totalResults: 1 }),
      );

    const result = await handleUserMessage(
      "chini aur sarso tel 1l chahiye",
      createInitialContext({ language: "hi", customerId: "u1" }),
      deps,
    );

    expect(mockedExecute).toHaveBeenCalledTimes(2);

    const firstArgs = mockedExecute.mock.calls[0][1];
    expect(String(firstArgs.keyword)).toMatch(/chini/i);
    expect(firstArgs.preferSize).toBeUndefined();
    expect(firstArgs.searchQueue).toEqual(
      expect.arrayContaining([expect.stringMatching(/sarso|tel/i)]),
    );

    const secondArgs = mockedExecute.mock.calls[1][1];
    expect(String(secondArgs.keyword)).toMatch(/sarso|tel/i);
    expect(secondArgs.preferSize).toBe("1l");
    expect(secondArgs.limit).toBe(12);

    expect(result.toolResults).toHaveLength(2);
    expect(result.assistantMessage).toMatch(/chini/i);
    expect(result.assistantMessage).toMatch(/Fortune|Mustard|oil|Mil|Found|add/i);
    expect(
      result.contextPatch.pendingProductSelection ||
        result.contextPatch.pendingConfirmation,
    ).toBeTruthy();
  });

  it("auto-continues empty search to non-sizeful keyword WITHOUT preferSize", async () => {
    mockedExecute
      .mockResolvedValueOnce(
        searchResult("chini", [], { count: 0, totalResults: 0 }),
      )
      .mockResolvedValueOnce(searchResult("chawal", [sugar]));

    const result = await handleUserMessage(
      "chini aur chawal",
      createInitialContext({ language: "hi" }),
      deps,
    );

    expect(mockedExecute).toHaveBeenCalledTimes(2);
    expect(mockedExecute.mock.calls[1][1].preferSize).toBeUndefined();
    expect(String(mockedExecute.mock.calls[1][1].keyword)).toMatch(/chawal/i);
    expect(result.toolResults.length).toBe(2);
  });

  it("after addToCart auto-searches next queued product with preferSize", async () => {
    const session = createInitialContext({
      language: "hi",
      customerId: "u1",
      pendingConfirmation: {
        title: "Cart mein add karein?",
        summary: { Product: sugar.name, Quantity: "1" },
        toolName: "addToCart",
        toolArgs: { productId: "sugar1", quantity: 1, name: sugar.name },
      },
      pendingSearchQueue: ["sarso tel"],
      pendingSearchPreferSize: "1l",
    });

    mockedExecute
      .mockResolvedValueOnce({
        ok: true,
        toolName: "addToCart",
        data: {
          name: sugar.name,
          quantity: 1,
          lineQuantity: 1,
          cartItemCount: 1,
          cartItems: [
            {
              productId: "sugar1",
              name: sugar.name,
              quantity: 1,
              unitPrice: 59,
              lineTotal: 59,
            },
          ],
        },
      })
      .mockResolvedValueOnce(
        searchResult("sarso tel", [oil1l], { totalResults: 1 }),
      );

    const result = await handleUserMessage("haan", session, deps);

    expect(mockedExecute).toHaveBeenCalledTimes(2);
    expect(mockedExecute.mock.calls[0][0]).toBe("addToCart");
    expect(mockedExecute.mock.calls[1][0]).toBe("searchProducts");
    expect(String(mockedExecute.mock.calls[1][1].keyword)).toMatch(/sarso|tel/i);
    expect(mockedExecute.mock.calls[1][1].preferSize).toBe("1l");
    expect(result.assistantMessage).toMatch(/add|cart/i);
    expect(result.assistantMessage).toMatch(/Fortune|Mustard|oil|Mil|Found|next|Ab/i);
  });

  it("does not auto-continue when search returns products", async () => {
    mockedExecute.mockResolvedValueOnce(
      searchResult("chini", [sugar], {
        totalResults: 5,
        hasMore: true,
        count: 1,
      }),
    );

    const result = await handleUserMessage(
      "chini aur sarso tel",
      createInitialContext({ language: "hi" }),
      deps,
    );

    expect(mockedExecute).toHaveBeenCalledTimes(1);
    expect(result.contextPatch.pendingSearchQueue).toEqual(
      expect.arrayContaining([expect.stringMatching(/sarso|tel/i)]),
    );
    expect(result.contextPatch.pendingTool).not.toBe("continueSearchQueue");
  });

  it("does not search non-shopping leftovers (no catalog call)", async () => {
    const result = await handleUserMessage(
      "xyzabc",
      createInitialContext({ language: "hi" }),
      deps,
    );

    expect(mockedExecute).not.toHaveBeenCalled();
    expect(result.toolCalls).toHaveLength(0);
    expect(result.assistantMessage).toMatch(/Samajh nahi|product|Fortune/i);
    expect(result.contextPatch.pendingTool).toBeFalsy();
  });

  it("empty grocery search with no queue does not auto-continue", async () => {
    mockedExecute.mockResolvedValueOnce(
      searchResult("chini", [], { count: 0, totalResults: 0 }),
    );

    const result = await handleUserMessage(
      "chini",
      createInitialContext({ language: "hi" }),
      deps,
    );

    expect(mockedExecute).toHaveBeenCalledTimes(1);
    expect(result.assistantMessage).toMatch(/nahi mila|No products/i);
    expect(result.contextPatch.pendingTool).toBeFalsy();
  });

  it("soft-escape confirm notePrefix is prepended", async () => {
    mockedExecute.mockResolvedValueOnce(searchResult("atta", [sugar]));

    const result = await handleUserMessage(
      "atta chahiye",
      createInitialContext({
        language: "hi",
        pendingConfirmation: {
          title: "Add?",
          summary: {},
          toolName: "addToCart",
          toolArgs: { productId: "x", quantity: 1 },
        },
      }),
      deps,
    );

    expect(result.assistantMessage).toMatch(/cancel|Pehle wala/i);
    expect(mockedExecute).toHaveBeenCalledWith(
      "searchProducts",
      expect.objectContaining({
        keyword: expect.stringMatching(/atta/i),
      }),
      expect.anything(),
    );
  });

  it("merges sessionPatch pendingSearchPreferSize into first search turn", async () => {
    mockedExecute.mockResolvedValueOnce(
      searchResult("chini", [sugar], { totalResults: 1 }),
    );

    const result = await handleUserMessage(
      "chini aur sarso tel 1l",
      createInitialContext({ language: "hi" }),
      deps,
    );

    expect(result.contextPatch.pendingSearchPreferSize).toBe("1l");
    expect(result.contextPatch.pendingSearchQueue).toEqual(
      expect.arrayContaining([expect.stringMatching(/sarso|tel/i)]),
    );
  });

  it("checkout startCheckout is executed once", async () => {
    mockedExecute.mockResolvedValueOnce({
      ok: true,
      toolName: "startCheckout",
      data: {
        status: "proceed",
        payableTotal: 400,
        orderDiscount: 0,
      },
    });

    const result = await handleUserMessage(
      "checkout karo",
      createInitialContext({
        language: "hi",
        customerId: "u1",
        cartItemCount: 2,
      }),
      deps,
    );

    expect(mockedExecute).toHaveBeenCalledTimes(1);
    expect(mockedExecute.mock.calls[0][0]).toBe("startCheckout");
    expect(result.uiAction).toEqual({ action: "OPEN_PAYMENT" });
    expect(result.contextPatch.paymentPending).toBe(true);
  });

  it("after add does not search next when queue empty", async () => {
    const session = createInitialContext({
      language: "hi",
      customerId: "u1",
      pendingConfirmation: {
        title: "Add?",
        summary: {},
        toolName: "addToCart",
        toolArgs: { productId: "sugar1", quantity: 1 },
      },
      pendingSearchQueue: [],
    });

    mockedExecute.mockResolvedValueOnce({
      ok: true,
      toolName: "addToCart",
      data: {
        name: sugar.name,
        quantity: 1,
        lineQuantity: 1,
        cartItemCount: 1,
        cartItems: [],
      },
    });

    const result = await handleUserMessage("haan", session, deps);
    expect(mockedExecute).toHaveBeenCalledTimes(1);
    expect(result.contextPatch.pendingTool).not.toBe("continueSearchQueue");
  });
});
