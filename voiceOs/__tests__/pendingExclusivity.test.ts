/**
 * Regression: dual pending state must not let "yes" resume a stale drink list
 * after pivoting oil → drink → masala → heeng.
 */
import { executeTool } from "@/voiceOs/toolExecutor";
import { planTurn } from "@/voiceOs/agent/localAgent";
import { createInitialContext } from "@/voiceOs/types";
import {
  installDefaultCatalogMock,
  runScript,
  searchResult,
} from "./qaHarness";

jest.mock("@/voiceOs/toolExecutor", () => ({
  executeTool: jest.fn(),
}));

jest.mock("@/voiceOs/agent/llmClient", () => ({
  isShopAssistLlmEnabled: () => false,
  callShopAssistLlm: jest.fn(),
}));

const mockedExecute = executeTool as jest.MockedFunction<typeof executeTool>;

const hingProduct = {
  _id: "hing1",
  name: "Everest Compounded Asafoetida Hing",
  size: "50 g",
  price: 55,
  discountedPrice: 55,
  isOutOfStock: false,
  maxQuantity: 5,
  image: null,
};

const drinkProduct = {
  _id: "drink1",
  name: "Sting Energy Drink 250 Ml",
  size: "250 ml",
  price: 22,
  discountedPrice: 22,
  isOutOfStock: false,
  maxQuantity: 5,
  image: null,
};

const drink2 = {
  ...drinkProduct,
  _id: "drink2",
  name: "Maaza Mango Drink 600 Ml",
  size: "600 ml",
  price: 38,
  discountedPrice: 38,
};

describe("exclusive awaiting input — heeng after drink pivot", () => {
  beforeEach(() => {
    mockedExecute.mockReset();
    installDefaultCatalogMock(mockedExecute);
    const base = mockedExecute.getMockImplementation()!;
    mockedExecute.mockImplementation(async (name, args) => {
      if (name === "searchProducts") {
        const kw = String(args?.keyword ?? "").toLowerCase();
        if (/hing|heeng|asafoetida/.test(kw)) {
          return searchResult(String(args?.keyword ?? "hing"), [hingProduct]);
        }
        if (/drink/.test(kw)) {
          return searchResult(String(args?.keyword ?? "drink"), [
            drinkProduct,
            drink2,
          ]);
        }
      }
      return base(name, args);
    });
  });

  it("oil → drink → masala → i want heeng searches hing (not drinks)", async () => {
    const session = await runScript(mockedExecute, [
      {
        user: "oil",
        assert: {
          tools: [],
          toolsNot: ["searchProducts"],
          messageMatch: /Which oil|Kaunsa oil|mustard|sunflower/i,
        },
      },
      {
        user: "i want drink",
        assert: {
          tools: ["searchProducts"],
          searchKeyword: /drink/i,
          pendingProductSelection: true,
        },
      },
      {
        user: "i want masala",
        assert: {
          tools: [],
          toolsNot: ["searchProducts"],
          messageMatch: /Haldi|mirch|Hing|masala/i,
          pendingProductSelection: false,
        },
      },
      {
        user: "i want heeng",
        assert: {
          tools: ["searchProducts"],
          searchKeyword: /^hing$/i,
          toolsNot: ["addToCart"],
          messageNotMatch: /drink|Sting|Which drink/i,
        },
      },
    ]);

    expect(session.pendingBroadOptions).toBeNull();
    expect(session.lastAssistantPromptType).not.toBe("broad_category");
  });

  it("masala broad + stale drink selection: yes re-asks masala, does not resume drinks", () => {
    const ctx = createInitialContext({
      language: "en",
      lastAssistantPromptType: "broad_category",
      pendingBroadOptions: [
        "turmeric powder",
        "red chilli powder",
        "coriander powder",
        "cumin",
        "garam masala",
        "hing",
      ],
      pendingProductSelection: true,
      lastSearchQuery: "drink",
      lastSearchProducts: [drinkProduct, drink2],
    });

    const yes = planTurn("yes", ctx);
    expect(yes.toolCalls).toHaveLength(0);
    expect(yes.earlyResult?.assistantMessage).toMatch(
      /Which option|Kaunsa option|hing|garam/i,
    );
    expect(yes.earlyResult?.assistantMessage).not.toMatch(/drink|Sting|Maaza/i);

    const heeng = planTurn("i want heeng", ctx);
    expect(heeng.toolCalls[0]?.name).toBe("searchProducts");
    expect(String(heeng.toolCalls[0]?.args.keyword)).toMatch(/^hing$/i);
  });

  it("entering masala broad clears pendingProductSelection", () => {
    const afterDrink = createInitialContext({
      language: "en",
      pendingProductSelection: true,
      lastSearchQuery: "drink",
      lastSearchProducts: [drinkProduct],
    });
    const r = planTurn("masala", afterDrink);
    expect(r.toolCalls).toHaveLength(0);
    expect(r.earlyResult?.contextPatch?.pendingProductSelection).toBe(false);
    expect(r.earlyResult?.contextPatch?.lastSearchProducts).toEqual([]);
    expect(r.earlyResult?.contextPatch?.pendingBroadOptions).toContain("hing");
  });
});
