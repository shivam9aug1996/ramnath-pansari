/**
 * Classifier contract: one primary category, documented precedence,
 * positive + negative examples per category, UNKNOWN safety invariants.
 */
import { planTurn } from "@/voiceOs/agent/localAgent";
import {
  CATEGORY_PRECEDENCE,
  classifyUtterance,
  formatTurnDecisionDebug,
  buildTurnDecisionDebug,
} from "@/voiceOs/agent/utteranceClassifier";
import type { UtteranceCategory } from "@/voiceOs/agent/utteranceClassifier";
import { createInitialContext, derivePhase } from "@/voiceOs/types";
import type { SessionProduct } from "@/voiceOs/types";

const oil: SessionProduct = {
  _id: "oil1",
  name: "Fortune Oil",
  size: "1 L",
  price: 190,
  discountedPrice: 190,
  isOutOfStock: false,
  maxQuantity: 5,
  image: null,
};

function idle() {
  return createInitialContext({ language: "en" });
}

function confirmCtx() {
  return createInitialContext({
    language: "en",
    pendingConfirmation: {
      title: "Add?",
      summary: { Product: "Fortune Oil", Quantity: "2" },
      toolName: "addToCart",
      toolArgs: { productId: "oil1", quantity: 2 },
    },
    selectedProduct: oil,
  });
}

function qtyCtx() {
  return createInitialContext({
    language: "en",
    pendingQuantity: true,
    selectedProduct: oil,
    pendingTool: "addToCart",
  });
}

describe("CATEGORY_PRECEDENCE", () => {
  it("documents deterministic order AFFIRM > DENY > DECLINE > CHAT > SHOPPING > UNKNOWN", () => {
    const idx = (c: UtteranceCategory) => CATEGORY_PRECEDENCE.indexOf(c);
    expect(idx("AFFIRM")).toBeLessThan(idx("DENY"));
    expect(idx("DENY")).toBeLessThan(idx("DECLINE"));
    expect(idx("DECLINE")).toBeLessThan(idx("GREETING"));
    expect(idx("GREETING")).toBeLessThan(idx("CHAT"));
    expect(idx("CHAT")).toBeLessThan(idx("SOFT_ESCAPE"));
    expect(idx("SOFT_ESCAPE")).toBeLessThan(idx("SHOPPING_ADVICE"));
    expect(idx("SHOPPING_ADVICE")).toBeLessThan(idx("SHOPPING"));
    expect(idx("SHOPPING")).toBeLessThan(idx("UNKNOWN"));
  });

  it("ok resolves to exactly one primary: AFFIRM (not CHAT)", () => {
    const c = classifyUtterance("ok", confirmCtx());
    expect(c.category).toBe("AFFIRM");
    expect(c.flags.affirm).toBe(true);
  });

  it("every utterance yields exactly one category from the precedence list", () => {
    const samples = [
      "",
      "ok",
      "no",
      "later",
      "hi",
      "fine",
      "nope",
      "2",
      "pehla",
      "checkout",
      "cart dikhao",
      "Fortune oil",
      "asdfasdf",
    ];
    for (const s of samples) {
      const c = classifyUtterance(s, confirmCtx());
      expect(CATEGORY_PRECEDENCE).toContain(c.category);
    }
  });
});

describe("category positive + negative examples", () => {
  type Case = {
    category: UtteranceCategory;
    positive: string[];
    negative: string[];
  };

  const cases: Case[] = [
    {
      category: "AFFIRM",
      positive: ["haan", "yes", "ok"],
      negative: ["Fortune oil", "nahi", "how are you"],
    },
    {
      category: "DENY",
      positive: ["nahi", "cancel", "no"],
      negative: ["haan", "Fortune oil", "later"],
    },
    {
      category: "DECLINE",
      positive: ["later", "maybe later", "I don't want anything", "phir kabhi"],
      negative: ["Fortune oil", "How are you?", "haan"],
    },
    {
      category: "GREETING",
      positive: ["Hi", "Hello", "Happy Diwali"],
      negative: ["Fortune oil", "How are you?", "later"],
    },
    {
      category: "CHAT",
      positive: ["How are you?", "fine", "I'm fine", "How's your day going?", "Thanks"],
      negative: ["Fortune oil", "Need atta", "later"],
    },
    {
      category: "SOFT_NO",
      positive: ["nope"],
      negative: ["Fortune oil", "haan", "How are you?"],
    },
    {
      category: "QUANTITY",
      positive: ["2", "teen"],
      negative: ["How are you?", "Fortune oil", "haan"],
    },
    {
      category: "INDEX",
      positive: ["pehla", "first"],
      negative: ["How are you?", "later"],
    },
    {
      category: "CHECKOUT",
      positive: ["checkout", "checkout karo"],
      negative: ["How are you?", "Fortune oil"],
    },
    {
      category: "CART",
      positive: ["cart dikhao"],
      negative: ["How are you?", "haan"],
    },
    {
      category: "SHOPPING",
      positive: ["Fortune oil", "Need atta"],
      negative: ["How are you?", "fine", "later", "asdfasdf", "Which oil should I buy?"],
    },
    {
      category: "SHOPPING_ADVICE",
      positive: [
        "Which brand oil should I buy?",
        "Best atta?",
        "Recommend a shampoo",
      ],
      negative: ["Fortune oil", "Need atta", "How are you?", "later"],
    },
    {
      category: "UNKNOWN",
      positive: ["asdfasdf", "What's today's weather?", "I want happiness"],
      negative: ["Fortune oil", "How are you?", "later", "haan", "Best atta?"],
    },
  ];

  it.each(cases)("$category positive matches", ({ category, positive }) => {
    for (const p of positive) {
      expect(classifyUtterance(p, idle()).category).toBe(category);
    }
  });

  it.each(cases)("$category negative does not match", ({ category, negative }) => {
    for (const p of negative) {
      expect(classifyUtterance(p, idle()).category).not.toBe(category);
    }
  });

  it("SOFT_ESCAPE positive only when write-gated", () => {
    expect(classifyUtterance("Fortune oil", idle()).category).toBe("SHOPPING");
    expect(classifyUtterance("Fortune oil", confirmCtx()).category).toBe(
      "SOFT_ESCAPE",
    );
    expect(classifyUtterance("How are you?", confirmCtx()).category).not.toBe(
      "SOFT_ESCAPE",
    );
  });
});

describe("UNKNOWN invariants", () => {
  const unknowns = [
    "asdfasdf",
    "What's today's weather?",
    "I want happiness",
    "?????",
  ];

  it.each(unknowns)("%s at idle — no search, phase stays idle", (utter) => {
    const ctx = idle();
    expect(classifyUtterance(utter, ctx).category).toBe("UNKNOWN");
    const r = planTurn(utter, ctx);
    expect(r.toolCalls).toHaveLength(0);
    expect(r.toolCalls.find((t) => t.name === "searchProducts")).toBeUndefined();
    expect(r.toolCalls.find((t) => t.name === "addToCart")).toBeUndefined();
    const merged = createInitialContext({ ...ctx, ...r.earlyResult?.contextPatch });
    expect(derivePhase(merged)).toBe("idle");
  });

  it.each(unknowns)(
    "%s at confirm — no search, does not clear confirmation, phase stays",
    (utter) => {
      const ctx = confirmCtx();
      expect(classifyUtterance(utter, ctx).category).toBe("UNKNOWN");
      const before = derivePhase(ctx);
      expect(before).toBe("awaiting_confirmation");
      const r = planTurn(utter, ctx);
      expect(r.toolCalls).toHaveLength(0);
      expect(r.notePrefix).toBeFalsy();
      expect(r.sessionPatch?.pendingConfirmation).toBeUndefined();
      // Must not soft-escape clear
      expect(r.sessionPatch?.pendingConfirmation).not.toBeNull();
      const merged = createInitialContext({
        ...ctx,
        ...r.sessionPatch,
        ...r.earlyResult?.contextPatch,
      });
      expect(merged.pendingConfirmation).toBeTruthy();
      expect(derivePhase(merged)).toBe("awaiting_confirmation");
      expect(r.earlyResult?.assistantMessage).toMatch(/Yes|No|Haan|Nahi|Confirm/i);
    },
  );

  it.each(unknowns)(
    "%s at qty — no search, keeps pendingQuantity",
    (utter) => {
      const ctx = qtyCtx();
      const r = planTurn(utter, ctx);
      expect(r.toolCalls).toHaveLength(0);
      expect(r.sessionPatch?.pendingQuantity).not.toBe(false);
      const merged = createInitialContext({
        ...ctx,
        ...r.sessionPatch,
        ...r.earlyResult?.contextPatch,
      });
      expect(merged.pendingQuantity).toBe(true);
      expect(merged.selectedProduct).toBeTruthy();
      expect(derivePhase(merged)).toBe("awaiting_qty");
    },
  );
});

describe("debug decision format", () => {
  it("formats classifier decision for QA", () => {
    const info = buildTurnDecisionDebug(
      "How's your day going?",
      confirmCtx(),
      [],
    );
    expect(info.classification.category).toBe("CHAT");
    expect(info.classification.subtype).toBe("DAY_GOING");
    expect(info.decision).toMatch(/Hold conversation/i);
    const text = formatTurnDecisionDebug(info);
    expect(text).toMatch(/Category: CHAT/);
    expect(text).toMatch(/Subtype: DAY_GOING/);
    expect(text).toMatch(/awaiting_confirmation/);
    expect(text).toMatch(/Tool Calls: None/);
  });
});
