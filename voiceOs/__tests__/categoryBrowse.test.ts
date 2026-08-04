/**
 * Category catalog browse — list → pick → spice/oil clarify (not keyword dump).
 */
import { planTurn } from "@/voiceOs/agent/localAgent";
import { getBroadCategoryClarify } from "@/voiceOs/agent/broadCategories";
import {
  isCategoryCatalogQuestion,
  matchCategoryListSelection,
  normalizeCategoryKeyword,
} from "@/voiceOs/agent/storeCategories";
import { createInitialContext } from "@/voiceOs/types";
import { executeTool } from "@/voiceOs/toolExecutor";
import {
  installDefaultCatalogMock,
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

describe("store category helpers", () => {
  it("normalizes masale → masala", () => {
    expect(normalizeCategoryKeyword("masale")).toBe("masala");
    expect(normalizeCategoryKeyword("Masale")).toBe("masala");
  });

  it("detects category catalog questions", () => {
    expect(isCategoryCatalogQuestion("what categories you have?")).toBe(true);
    expect(isCategoryCatalogQuestion("What categories do you have?")).toBe(true);
    expect(isCategoryCatalogQuestion("kya categories hain")).toBe(true);
    expect(isCategoryCatalogQuestion("masale")).toBe(false);
  });

  it("matches list selection by name or number", () => {
    expect(matchCategoryListSelection("masale")?.id).toBe("masala");
    expect(matchCategoryListSelection("5")?.id).toBe("masala");
    expect(matchCategoryListSelection("Oil")?.id).toBe("oil");
  });

  it("broad clarify for masale includes spices not oats", () => {
    const broad = getBroadCategoryClarify("masale");
    expect(broad).not.toBeNull();
    expect(broad!.options.join(" ")).toMatch(/turmeric|chilli|coriander|cumin|garam|hing/i);
    expect(broad!.options.join(" ")).not.toMatch(/oats|noodles/i);
  });
});

describe("category browse flow", () => {
  beforeEach(() => {
    mockedExecute.mockReset();
    installDefaultCatalogMock(mockedExecute);
  });

  it("what categories → masale → spice clarify (never Masala Oats search)", async () => {
    await runScript(mockedExecute, [
      {
        user: "what categories you have?",
        assert: {
          tools: [],
          toolsNot: ["searchProducts", "addToCart"],
          messageMatch: /Masale|Atta|Oil|categories/i,
        },
      },
      {
        user: "masale",
        assert: {
          tools: [],
          toolsNot: ["searchProducts"],
          messageMatch: /Haldi|mirch|Dhaniya|Jeera|Garam|Hing|masala/i,
          messageNotMatch: /Masala Oats|Found top|Mil gaya/i,
        },
      },
    ]);
  });

  it("standalone masale clarifies spices instead of keyword dump", () => {
    const r = planTurn(
      "masale",
      createInitialContext({ language: "hi", customerName: "Shivam" }),
    );
    expect(r.toolCalls).toHaveLength(0);
    expect(r.earlyResult?.contextPatch?.lastAssistantPromptType).toBe(
      "broad_category",
    );
    expect(r.earlyResult?.assistantMessage).toMatch(/Haldi|mirch|Dhaniya|Jeera/i);
  });

  it("standalone masala clarifies spices", () => {
    const r = planTurn("masala", createInitialContext({ language: "hi" }));
    expect(r.toolCalls).toHaveLength(0);
    expect(r.earlyResult?.assistantMessage).toMatch(/Haldi|Lal mirch|Jeera/i);
  });

  it("bare oil clarifies oil types", () => {
    const r = planTurn("oil", createInitialContext({ language: "en" }));
    expect(r.toolCalls).toHaveLength(0);
    expect(r.earlyResult?.contextPatch?.lastAssistantPromptType).toBe(
      "broad_category",
    );
    expect(r.earlyResult?.assistantMessage).toMatch(
      /mustard|sunflower|Which oil|Kaunsa oil/i,
    );
  });

  it("categories → masale → haldi searches turmeric powder", async () => {
    await runScript(mockedExecute, [
      {
        user: "what categories you have?",
        assert: { toolsNot: ["searchProducts"] },
      },
      {
        user: "masale",
        assert: {
          tools: [],
          messageMatch: /Haldi|masala/i,
        },
      },
      {
        user: "haldi",
        assert: {
          tools: ["searchProducts"],
          searchKeyword: /turmeric powder/i,
        },
      },
    ]);
  });

  it("category list number 5 picks masala spices", () => {
    const ctx = createInitialContext({
      language: "hi",
      lastAssistantPromptType: "category_list",
    });
    const r = planTurn("5", ctx);
    expect(r.toolCalls).toHaveLength(0);
    expect(r.earlyResult?.contextPatch?.lastAssistantPromptType).toBe(
      "broad_category",
    );
    expect(r.earlyResult?.assistantMessage).toMatch(/Haldi|mirch/i);
  });
});
