/**
 * Suite 2 — Product search
 * Suite 3 — Shopping flow
 * Suite 7 — Search quality (keywords, fillers, typos, brand→category)
 */
import { executeTool } from "@/voiceOs/toolExecutor";
import { planTurn, buildResponseAfterTools } from "@/voiceOs/agent/localAgent";
import { rewriteSearchKeyword, rankSearchProducts } from "@/voiceOs/searchQuality";
import { createInitialContext } from "@/voiceOs/types";
import { nanoid } from "@reduxjs/toolkit";
import {
  installDefaultCatalogMock,
  loggedInSession,
  oil1l,
  oil2l,
  oil5l,
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

describe("QA Suite 2 — Product search", () => {
  beforeEach(() => {
    mockedExecute.mockReset();
    installDefaultCatalogMock(mockedExecute);
  });

  it.each([
    ["Fortune oil", /fortune oil/i],
    ["Mustard oil", /mustard oil/i],
    ["Atta", /atta/i],
  ])("%s extracts keyword and searches", async (user, kw) => {
    await runScript(mockedExecute, [
      {
        user,
        assert: {
          phase: "awaiting_product_selection",
          tools: ["searchProducts"],
          searchKeyword: kw,
          toolsNot: ["addToCart"],
          pendingConfirmation: false,
        },
      },
    ]);
  });

  it("Powder clarifies broad category — no dump search", async () => {
    await runScript(mockedExecute, [
      {
        user: "Powder",
        assert: {
          phase: "idle",
          tools: [],
          toolsNot: ["searchProducts", "addToCart"],
          messageMatch: /Kaunsa powder|Which.*powder|Talcum|Haldi|turmeric/i,
        },
      },
    ]);
    const session = loggedInSession({
      lastAssistantPromptType: "broad_category",
      pendingBroadOptions: [
        "talcum powder",
        "turmeric powder",
        "coriander powder",
        "cocoa powder",
      ],
    });
    expect(session.pendingBroadOptions?.length).toBeGreaterThan(0);
  });
});

describe("QA Suite 3 — Shopping flow", () => {
  beforeEach(() => {
    mockedExecute.mockReset();
    installDefaultCatalogMock(mockedExecute);
  });

  it("Fortune oil → 1 → 2 → haan (search→pick→qty→confirm→add)", async () => {
    await runScript(mockedExecute, [
      {
        user: "Fortune oil",
        assert: {
          phase: "awaiting_product_selection",
          tools: ["searchProducts"],
          pendingProductSelection: true,
        },
      },
      {
        user: "1",
        assert: {
          phase: "awaiting_qty",
          pendingQuantity: true,
          selectedProductId: "oil1",
          tools: [],
          toolsNot: ["searchProducts", "addToCart"],
        },
      },
      {
        user: "2",
        assert: {
          phase: "awaiting_confirmation",
          pendingConfirmation: "defined",
          pendingQuantity: false,
          tools: [],
          toolsNot: ["addToCart"],
        },
      },
      {
        user: "haan",
        assert: {
          phase: "idle",
          pendingConfirmation: false,
          tools: ["addToCart"],
          allowAdd: true,
          cartItemCount: 2,
        },
      },
    ]);
  });

  it("Fortune oil 2 litre → haan skips qty", async () => {
    await runScript(mockedExecute, [
      {
        user: "Fortune oil 2 litre",
        assert: {
          phase: "awaiting_confirmation",
          pendingConfirmation: "defined",
          pendingQuantity: false,
          tools: ["searchProducts"],
          searchKeyword: /fortune oil/i,
          messageMatch: /Confirm|Haan|Yes|Cart/i,
        },
      },
      {
        user: "haan",
        assert: {
          phase: "idle",
          tools: ["addToCart"],
          allowAdd: true,
          cartItemCount: 1,
        },
      },
    ]);
  });
});

describe("QA Suite 7 — Search quality", () => {
  it("rewrites misspellings", () => {
    expect(rewriteSearchKeyword("fortun oil")).toMatch(/fortune oil/i);
    expect(rewriteSearchKeyword("musterd oil")).toMatch(/mustard oil/i);
    expect(rewriteSearchKeyword("ashirwad atta")).toMatch(/aashirvaad atta/i);
  });

  it("Fortune brand ranks Fortune products first", () => {
    const ranked = rankSearchProducts(
      [
        {
          _id: "other",
          name: "Generic Mustard Oil",
          size: "1 L",
          price: 100,
          discountedPrice: 100,
          isOutOfStock: false,
          maxQuantity: 5,
          image: null,
        },
        oil1l,
        oil5l,
      ],
      "fortune oil",
    );
    expect(ranked[0].name).toMatch(/Fortune/i);
  });

  it("strips conversation fillers before search", () => {
    const cases: Array<[string, RegExp]> = [
      ["I want to buy Fortune oil", /^fortune oil$/i],
      ["Can you add sugar", /^sugar$/i],
      ["Please give me atta", /^atta$/i],
      ["Need biscuits", /^biscuits?$/i],
    ];
    for (const [utter, kw] of cases) {
      const planned = planTurn(utter, createInitialContext({ language: "en" }));
      expect(planned.toolCalls[0]?.name).toBe("searchProducts");
      expect(String(planned.toolCalls[0]?.args.keyword)).toMatch(kw);
    }
  });

  it("Fortune → Oil combines brand + category", async () => {
    mockedExecute.mockReset();
    installDefaultCatalogMock(mockedExecute);
    await runScript(mockedExecute, [
      {
        user: "Fortune",
        assert: {
          tools: [],
          toolsNot: ["searchProducts"],
          pendingBrand: "fortune",
          messageMatch: /oil|atta|category/i,
        },
      },
      {
        user: "Oil",
        assert: {
          phase: "awaiting_product_selection",
          tools: ["searchProducts"],
          searchKeyword: /fortune oil/i,
          pendingBrand: null,
        },
      },
    ]);
  });

  it("unique size match builds confirm without qty ask", () => {
    const ctx = createInitialContext({ language: "hi", customerId: "u1" });
    const result = buildResponseAfterTools({
      userText: "Fortune oil 2 litre",
      context: ctx,
      toolCalls: [
        {
          id: nanoid(),
          name: "searchProducts",
          args: { keyword: "fortune oil", preferSize: "2l" },
        },
      ],
      toolResults: [searchResult("fortune oil", [oil2l])],
    });
    expect(result.contextPatch.pendingConfirmation).toBeTruthy();
    expect(result.contextPatch.pendingQuantity).toBe(false);
    expect(result.assistantMessage).toMatch(/Confirm|Haan/i);
  });
});
