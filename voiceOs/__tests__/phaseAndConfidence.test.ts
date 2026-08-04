import {
  CONFIDENCE_CLARIFY_THRESHOLD,
  isGroceryishKeyword,
  scoreProductPickConfidence,
  scoreSearchConfidence,
} from "@/voiceOs/agent/confidence";
import { derivePhase, createInitialContext } from "@/voiceOs/types";
import { planTurn } from "@/voiceOs/agent/localAgent";
import { getPhase, isWriteGatedPhase } from "@/voiceOs/agent/phase";

describe("conversation phase FSM shim", () => {
  it("starts idle", () => {
    expect(createInitialContext().phase).toBe("idle");
    expect(derivePhase(createInitialContext())).toBe("idle");
  });

  it("maps pending flags to phases", () => {
    expect(
      derivePhase(
        createInitialContext({
          pendingConfirmation: {
            title: "x",
            summary: {},
            toolName: "addToCart",
            toolArgs: {},
          },
        }),
      ),
    ).toBe("awaiting_confirmation");

    expect(
      derivePhase(
        createInitialContext({
          pendingQuantity: true,
          selectedProduct: {
            _id: "1",
            name: "Oil",
          },
        }),
      ),
    ).toBe("awaiting_qty");

    expect(
      derivePhase(
        createInitialContext({
          pendingProductSelection: true,
          lastSearchProducts: [{ _id: "1", name: "Oil" }],
        }),
      ),
    ).toBe("awaiting_product_selection");

    expect(
      derivePhase(
        createInitialContext({
          pendingMultiProductConfirm: {
            products: ["oil", "sugar"],
            fullPhrase: "oil sugar",
          },
        }),
      ),
    ).toBe("awaiting_multi_product_confirm");
  });

  it("isWriteGatedPhase covers confirm/qty/multi", () => {
    expect(isWriteGatedPhase("awaiting_confirmation")).toBe(true);
    expect(isWriteGatedPhase("awaiting_qty")).toBe(true);
    expect(isWriteGatedPhase("idle")).toBe(false);
  });

  it("planTurn syncs phase into confirmation patch", () => {
    const ctx = createInitialContext({
      language: "en",
      pendingQuantity: true,
      selectedProduct: {
        _id: "oil1",
        name: "Fortune Oil",
        size: "1 L",
        maxQuantity: 5,
      },
    });
    expect(getPhase(ctx)).toBe("awaiting_qty");
    const planned = planTurn("2", ctx);
    expect(planned.earlyResult?.contextPatch.phase).toBe(
      "awaiting_confirmation",
    );
    expect(planned.turnPlan?.intent).toBe("quantity");
  });
});

describe("search / pick confidence", () => {
  it("scores grocery keywords high", () => {
    expect(isGroceryishKeyword("fortune oil")).toBe(true);
    expect(
      scoreSearchConfidence({
        keyword: "fortune oil",
        preferSize: null,
        intentAdd: false,
      }),
    ).toBeGreaterThanOrEqual(CONFIDENCE_CLARIFY_THRESHOLD);
  });

  it("clarifies tiny non-grocery phrases via planTurn", () => {
    const planned = planTurn("ab", createInitialContext({ language: "en" }));
    expect(planned.toolCalls).toHaveLength(0);
    expect(planned.turnPlan?.intent).toBe("clarify");
    expect(planned.earlyResult?.assistantMessage).toMatch(/clear|product|catch/i);
  });

  it("single pick is high confidence", () => {
    expect(
      scoreProductPickConfidence({
        matchCount: 1,
        optionCount: 8,
        usedIndex: true,
      }),
    ).toBeGreaterThanOrEqual(CONFIDENCE_CLARIFY_THRESHOLD);
  });

  it("multi pick is below threshold", () => {
    expect(
      scoreProductPickConfidence({
        matchCount: 3,
        optionCount: 8,
        usedIndex: false,
      }),
    ).toBeLessThan(CONFIDENCE_CLARIFY_THRESHOLD);
  });
});
