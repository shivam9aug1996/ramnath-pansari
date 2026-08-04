/**
 * Suite 4 — Mixed conversation + shopping
 * Suite 5 — Interruptions at every gate
 * Edge: cancel / No / restart without accidental selection
 */
import { executeTool } from "@/voiceOs/toolExecutor";
import { derivePhase } from "@/voiceOs/types";
import {
  installDefaultCatalogMock,
  loggedInSession,
  mergeSession,
  qaDeps,
  runScript,
} from "./qaHarness";
import { handleUserMessage } from "@/voiceOs/conversationManager";

jest.mock("@/voiceOs/toolExecutor", () => ({
  executeTool: jest.fn(),
}));

jest.mock("@/voiceOs/agent/llmClient", () => ({
  isShopAssistLlmEnabled: () => false,
  callShopAssistLlm: jest.fn(),
}));

const mockedExecute = executeTool as jest.MockedFunction<typeof executeTool>;

describe("QA Suite 4 — Mixed conversation", () => {
  beforeEach(() => {
    mockedExecute.mockReset();
    installDefaultCatalogMock(mockedExecute);
  });

  it("Hi → Fortune oil → How are you? → 1 → 2 → Thanks → haan", async () => {
    await runScript(mockedExecute, [
      {
        user: "Hi",
        assert: {
          phase: "idle",
          tools: [],
          toolsNot: ["searchProducts"],
        },
      },
      {
        user: "Fortune oil",
        assert: {
          phase: "awaiting_product_selection",
          pendingProductSelection: true,
          tools: ["searchProducts"],
        },
      },
      {
        user: "How are you?",
        assert: {
          phase: "awaiting_product_selection",
          pendingProductSelection: true,
          tools: [],
          toolsNot: ["searchProducts", "addToCart"],
          messageMatch: /badhiya|well|Kaunsa|Which/i,
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
        user: "2",
        assert: {
          phase: "awaiting_confirmation",
          pendingConfirmation: "defined",
          tools: [],
          toolsNot: ["addToCart"],
        },
      },
      {
        user: "Thanks",
        assert: {
          phase: "awaiting_confirmation",
          pendingConfirmation: "defined",
          tools: [],
          toolsNot: ["searchProducts", "addToCart"],
          messageMatch: /bilkul|welcome|Confirm/i,
        },
      },
      {
        user: "haan",
        assert: {
          phase: "idle",
          tools: ["addToCart"],
          allowAdd: true,
          cartItemCount: 2,
        },
      },
    ]);
  });
});

describe("QA Suite 5 — Interruptions", () => {
  beforeEach(() => {
    mockedExecute.mockReset();
    installDefaultCatalogMock(mockedExecute);
  });

  it("during product selection — How are you keeps list", async () => {
    await runScript(mockedExecute, [
      {
        user: "Fortune oil",
        assert: {
          phase: "awaiting_product_selection",
          tools: ["searchProducts"],
        },
      },
      {
        user: "How are you?",
        assert: {
          phase: "awaiting_product_selection",
          pendingProductSelection: true,
          tools: [],
          toolsNot: ["searchProducts"],
          messageMatch: /Kaunsa|Which|badhiya|well/i,
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
    ]);
  });

  it("during qty — How are you still waiting qty", async () => {
    await runScript(mockedExecute, [
      {
        user: "Fortune oil",
        assert: { phase: "awaiting_product_selection", tools: ["searchProducts"] },
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
        user: "How are you?",
        assert: {
          phase: "awaiting_qty",
          pendingQuantity: true,
          selectedProductId: "oil1",
          tools: [],
          toolsNot: ["searchProducts", "addToCart"],
          messageMatch: /quantity|Kitni|How many/i,
          messageNotMatch: /Skipped quantity|cancel/i,
        },
      },
    ]);
  });

  it("during confirm — How are you still waiting confirmation", async () => {
    await runScript(mockedExecute, [
      {
        user: "Fortune oil",
        assert: { tools: ["searchProducts"] },
      },
      { user: "1", assert: { phase: "awaiting_qty", tools: [] } },
      {
        user: "2",
        assert: {
          phase: "awaiting_confirmation",
          pendingConfirmation: "defined",
          tools: [],
        },
      },
      {
        user: "How are you?",
        assert: {
          phase: "awaiting_confirmation",
          pendingConfirmation: "defined",
          selectedProductId: "oil1",
          tools: [],
          toolsNot: ["searchProducts", "addToCart"],
          messageMatch: /Confirm|badhiya|well/i,
        },
      },
      {
        user: "haan",
        assert: {
          tools: ["addToCart"],
          allowAdd: true,
          cartItemCount: 2,
        },
      },
    ]);
  });
});

describe("QA interruptions — cancel / restart edges", () => {
  beforeEach(() => {
    mockedExecute.mockReset();
    installDefaultCatalogMock(mockedExecute);
  });

  it("Fortune oil → No → Atta cancels selection and starts fresh", async () => {
    await runScript(mockedExecute, [
      {
        user: "Fortune oil",
        assert: {
          phase: "awaiting_product_selection",
          tools: ["searchProducts"],
        },
      },
      {
        user: "No",
        assert: {
          phase: "idle",
          pendingProductSelection: false,
          tools: [],
          toolsNot: ["searchProducts", "addToCart"],
          messageMatch: /cancel|Theek|Want something/i,
        },
      },
      {
        user: "Atta",
        assert: {
          phase: "awaiting_product_selection",
          tools: ["searchProducts"],
          searchKeyword: /atta/i,
        },
      },
    ]);
  });

  it("Fortune oil → Cancel → Hi → Sugar is a fresh flow", async () => {
    await runScript(mockedExecute, [
      {
        user: "Fortune oil",
        assert: { tools: ["searchProducts"] },
      },
      {
        user: "1",
        assert: { phase: "awaiting_qty", tools: [] },
      },
      {
        user: "2",
        assert: { phase: "awaiting_confirmation", tools: [] },
      },
      {
        user: "Cancel",
        assert: {
          phase: "idle",
          pendingConfirmation: false,
          pendingQuantity: false,
          selectedProductId: null,
          tools: [],
        },
      },
      {
        user: "Hi",
        assert: {
          phase: "idle",
          tools: [],
          toolsNot: ["searchProducts"],
        },
      },
      {
        user: "Sugar",
        assert: {
          phase: "awaiting_product_selection",
          tools: ["searchProducts"],
          searchKeyword: /sugar/i,
        },
      },
    ]);
  });

  it("Fortune oil → 1 → No → 2 does not accidentally add", async () => {
    let session = loggedInSession();
    session = mergeSession(
      session,
      await handleUserMessage("Fortune oil", session, qaDeps),
    );
    session = mergeSession(
      session,
      await handleUserMessage("1", session, qaDeps),
    );
    expect(derivePhase(session)).toBe("awaiting_qty");

    const denied = await handleUserMessage("No", session, qaDeps);
    session = mergeSession(session, denied);
    expect(derivePhase(session)).toBe("idle");
    expect(session.pendingQuantity).toBe(false);
    expect(session.selectedProduct).toBeNull();
    expect(denied.toolCalls).toHaveLength(0);

    const before = mockedExecute.mock.calls.length;
    const after = await handleUserMessage("2", session, qaDeps);
    session = mergeSession(session, after);
    const tools = mockedExecute.mock.calls
      .slice(before)
      .map((c) => c[0] as string);
    expect(tools).not.toContain("addToCart");
    expect(session.pendingConfirmation).toBeNull();
    expect(session.cartItemCount).toBe(0);
  });
});
