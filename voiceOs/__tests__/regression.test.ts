/**
 * Suite 8 — End-to-end regression (must-pass CI gate)
 *
 * Full journeys spanning greeting → decline → broad → search → pick →
 * qty → confirm → add → checkout → cancel → bye, plus golden path edges.
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

describe("QA Suite 8 — End-to-end regression", () => {
  beforeEach(() => {
    mockedExecute.mockReset();
    installDefaultCatalogMock(mockedExecute);
  });

  it("full journey: greet → decline → powder → add → checkout cancel → bye", async () => {
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
        user: "How are you?",
        assert: {
          tools: [],
          toolsNot: ["searchProducts"],
          messageMatch: /badhiya|well/i,
        },
      },
      {
        user: "Nothing today",
        assert: {
          tools: [],
          toolsNot: ["searchProducts"],
          messageMatch: /Theek|Jab bhi|problem|Whenever/i,
        },
      },
      {
        user: "Actually powder chahiye",
        assert: {
          tools: [],
          toolsNot: ["searchProducts"],
          messageMatch: /Kaunsa powder|Which.*powder|Haldi|turmeric/i,
        },
      },
      {
        user: "Haldi powder",
        assert: {
          phase: "awaiting_product_selection",
          tools: ["searchProducts"],
          searchKeyword: /turmeric powder|haldi/i,
        },
      },
      {
        user: "Pehla",
        assert: {
          phase: "awaiting_qty",
          pendingQuantity: true,
          selectedProductId: "haldi1",
          tools: [],
          toolsNot: ["searchProducts"],
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
        user: "Haan",
        assert: {
          phase: "idle",
          tools: ["addToCart"],
          allowAdd: true,
          cartItemCount: 2,
        },
      },
      {
        user: "Checkout",
        assert: {
          phase: "payment",
          paymentPending: true,
          tools: ["startCheckout"],
          toolsNot: ["addToCart"],
        },
      },
      {
        user: "Nahi",
        assert: {
          phase: "idle",
          paymentPending: false,
          tools: [],
          toolsNot: ["searchProducts", "addToCart"],
          messageMatch: /cancel|Theek|Okay/i,
        },
      },
      {
        user: "Bye",
        assert: {
          phase: "idle",
          tools: [],
          toolsNot: ["searchProducts", "addToCart"],
          messageMatch: /Alvida|Bye/i,
        },
      },
    ]);
  });

  it("golden path Fortune oil → 1 → 2 → haan", async () => {
    await runScript(mockedExecute, [
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
        user: "2",
        assert: {
          phase: "awaiting_confirmation",
          pendingConfirmation: "defined",
          tools: [],
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

  it("Oil clarifies type — then mustard oil searches", async () => {
    await runScript(mockedExecute, [
      {
        user: "Oil",
        assert: {
          phase: "idle",
          tools: [],
          toolsNot: ["searchProducts"],
          messageMatch: /Which oil|Kaunsa oil|mustard|sunflower/i,
        },
      },
      {
        user: "mustard oil",
        assert: {
          phase: "awaiting_product_selection",
          tools: ["searchProducts"],
          searchKeyword: /mustard oil/i,
        },
      },
    ]);
  });

  it("soft-escape mid-qty to new product clears write gate", async () => {
    await runScript(mockedExecute, [
      {
        user: "Fortune oil",
        assert: { tools: ["searchProducts"] },
      },
      {
        user: "1",
        assert: { phase: "awaiting_qty", pendingQuantity: true, tools: [] },
      },
      {
        user: "Fortune atta",
        assert: {
          phase: "awaiting_product_selection",
          pendingQuantity: false,
          pendingConfirmation: false,
          selectedProductId: null,
          tools: ["searchProducts"],
          searchKeyword: /fortune atta|atta/i,
        },
      },
    ]);
  });

  it("size skip-qty then checkout path", async () => {
    let session = loggedInSession({ cartItemCount: 0 });
    session = mergeSession(
      session,
      await handleUserMessage("Fortune oil 2 litre", session, qaDeps),
    );
    expect(derivePhase(session)).toBe("awaiting_confirmation");
    expect(session.pendingConfirmation).toBeTruthy();

    session = mergeSession(
      session,
      await handleUserMessage("haan", session, qaDeps),
    );
    expect(session.cartItemCount).toBe(1);
    expect(derivePhase(session)).toBe("idle");

    session = mergeSession(
      session,
      await handleUserMessage("checkout", session, qaDeps),
    );
    expect(session.paymentPending).toBe(true);
    expect(derivePhase(session)).toBe("payment");

    session = mergeSession(
      session,
      await handleUserMessage("nahi", session, qaDeps),
    );
    expect(session.paymentPending).toBe(false);
    expect(derivePhase(session)).toBe("idle");
  });
});
