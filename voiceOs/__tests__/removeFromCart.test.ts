/**
 * Cart remove intent — never search catalog for "soybean oil remove".
 */
import { planTurn } from "@/voiceOs/agent/localAgent";
import {
  isRemoveFromCartIntent,
  extractRemoveCartQuery,
} from "@/voiceOs/agent/intentPlanner";
import { matchCartItems } from "@/voiceOs/agent/dialogueHelpers";
import { createInitialContext } from "@/voiceOs/types";
import { executeTool } from "@/voiceOs/toolExecutor";
import {
  installDefaultCatalogMock,
  oil1l,
  runScript,
} from "./qaHarness";

jest.mock("@/voiceOs/toolExecutor", () => ({
  executeTool: jest.fn(),
}));

jest.mock("@/voiceOs/agent/llmClient", () => ({
  isShopAssistLlmEnabled: () => false,
  callShopAssistLlm: jest.fn(),
}));

const mockedExecute = executeTool as jest.MockedFunction<typeof executeTool>;

const soyOilCart = {
  productId: "soy1",
  name: "Fortune Refined Soyabean Oil 174 Kg",
  quantity: 2,
  unitPrice: 399,
  lineTotal: 798,
};

const noodlesCart = {
  productId: "nood1",
  name: "Moi Soi Veg Hakka Noodles 500 G",
  quantity: 1,
  unitPrice: 60,
  lineTotal: 60,
};

describe("remove from cart", () => {
  beforeEach(() => {
    mockedExecute.mockReset();
    installDefaultCatalogMock(mockedExecute);
  });

  it("detects remove intent and extracts query", () => {
    expect(isRemoveFromCartIntent("soybean oil remove krdo")).toBe(true);
    expect(isRemoveFromCartIntent("cart se maggi hatao")).toBe(true);
    expect(isRemoveFromCartIntent("clear cart")).toBe(false);
    expect(extractRemoveCartQuery("soybean oil remove krdo")).toMatch(
      /soybean oil/i,
    );
  });

  it("matches soyabean cart line from soybean oil query", () => {
    const hits = matchCartItems("soybean oil", [soyOilCart, noodlesCart]);
    expect(hits).toHaveLength(1);
    expect(hits[0].productId).toBe("soy1");
  });

  it("soybean oil remove → confirm removeFromCart, never searchProducts", () => {
    const ctx = createInitialContext({
      language: "hi",
      customerId: "u1",
      cartItemCount: 2,
      cartItems: [soyOilCart, noodlesCart],
      pendingProductSelection: true,
      lastSearchQuery: "noodles",
      lastSearchProducts: [oil1l],
    });
    const r = planTurn("soybean oil remove krdo", ctx);
    expect(r.toolCalls).toHaveLength(0);
    expect(r.earlyResult?.contextPatch?.pendingConfirmation?.toolName).toBe(
      "removeFromCart",
    );
    expect(
      r.earlyResult?.contextPatch?.pendingConfirmation?.toolArgs?.productId,
    ).toBe("soy1");
    expect(r.earlyResult?.assistantMessage).toMatch(/hata du|Remove/i);
    expect(r.earlyResult?.assistantMessage).not.toMatch(/Found top|options/i);
  });

  it("haan after remove confirm executes removeFromCart", async () => {
    mockedExecute.mockImplementation(async (name, args) => {
      if (name === "removeFromCart") {
        return {
          ok: true,
          toolName: "removeFromCart",
          data: {
            productId: args.productId,
            name: args.name,
            cartItemCount: 1,
            cartItems: [noodlesCart],
          },
        };
      }
      return { ok: true, toolName: name, data: {} };
    });

    await runScript(
      mockedExecute,
      [
        {
          user: "soybean oil remove krdo",
          assert: {
            tools: [],
            toolsNot: ["searchProducts", "addToCart"],
            pendingConfirmation: "defined",
            messageMatch: /Soyabean|hata du|Remove/i,
          },
        },
        {
          user: "haan",
          assert: {
            tools: ["removeFromCart"],
            toolsNot: ["searchProducts", "addToCart"],
            cartItemCount: 1,
            messageMatch: /hata diya|Removed/i,
          },
        },
      ],
      createInitialContext({
        language: "hi",
        customerId: "u1",
        customerName: "Shivam",
        cartItemCount: 2,
        cartItems: [soyOilCart, noodlesCart],
      }),
    );
  });
});
