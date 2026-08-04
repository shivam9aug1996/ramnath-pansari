/**
 * SHOPPING_ADVICE vs SHOPPING — recommend first, search second.
 */
import { planTurn } from "@/voiceOs/agent/localAgent";
import { classifyUtterance } from "@/voiceOs/agent/utteranceClassifier";
import { isShoppingAdvice, isShoppingUtterance } from "@/voiceOs/agent/intentPlanner";
import { createInitialContext } from "@/voiceOs/types";

describe("SHOPPING_ADVICE intent", () => {
  const adviceCases = [
    "which brand oil i should buy?",
    "Which brand oil should I buy?",
    "Best atta?",
    "Recommend a shampoo",
    "Suggest biscuits",
    "Which rice is good?",
    "Best tea",
    "Good ghee",
    "Which oil is good for cholesterol?",
    "What is the difference between Fortune and Saffola?",
    "Is Aashirvaad better than Pillsbury?",
    "kaunsa oil lena chahiye",
  ];

  const searchCases = [
    "Fortune oil",
    "Need atta",
    "mustard oil",
    "Aashirvaad atta 5 kg",
  ];

  it.each(adviceCases)("%s → SHOPPING_ADVICE, no search", (utter) => {
    expect(isShoppingAdvice(utter)).toBe(true);
    expect(isShoppingUtterance(utter)).toBe(false);
    expect(classifyUtterance(utter).category).toBe("SHOPPING_ADVICE");

    const r = planTurn(utter, createInitialContext({ language: "en", customerName: "Shivam" }));
    expect(r.toolCalls).toHaveLength(0);
    expect(r.turnPlan?.intent).toBe("advice");
    expect(r.earlyResult?.assistantMessage).toBeTruthy();
    expect(r.earlyResult?.assistantMessage).not.toMatch(/Found top|Mil gaya/i);
    expect(r.earlyResult?.assistantMessage).toMatch(
      /purpose|Fortune|Saffola|brand|suggest|options|Type|Tell me|bolo|dikha|Aashirvaad|popular|Name/i,
    );
  });

  it.each(searchCases)("%s → SHOPPING search, not advice", (utter) => {
    expect(isShoppingAdvice(utter)).toBe(false);
    expect(classifyUtterance(utter).category).toBe("SHOPPING");
    const r = planTurn(utter, createInitialContext({ language: "en" }));
    expect(r.toolCalls[0]?.name).toBe("searchProducts");
  });

  it("oil chahiye → broad oil clarify, not advice dump search", () => {
    expect(isShoppingAdvice("oil chahiye")).toBe(false);
    expect(classifyUtterance("oil chahiye").category).toBe("SHOPPING");
    const r = planTurn("oil chahiye", createInitialContext({ language: "en" }));
    expect(r.toolCalls).toHaveLength(0);
    expect(r.earlyResult?.contextPatch?.lastAssistantPromptType).toBe(
      "broad_category",
    );
    expect(r.earlyResult?.assistantMessage).toMatch(
      /Which oil|Kaunsa oil|mustard|sunflower/i,
    );
  });

  it("which brand oil should I buy — never searches Dr Brand token noise", () => {
    const r = planTurn(
      "which brand oil i should buy?",
      createInitialContext({ language: "en" }),
    );
    expect(r.toolCalls).toHaveLength(0);
    expect(String(r.earlyResult?.assistantMessage ?? "")).not.toMatch(/Dr Brand/i);
    expect(r.earlyResult?.assistantMessage).toMatch(/oil|Fortune|Saffola|mustard/i);
  });

  it("advice then Fortune oil still searches", () => {
    const advice = planTurn(
      "Which oil should I buy?",
      createInitialContext({ language: "hi" }),
    );
    expect(advice.toolCalls).toHaveLength(0);
    const ctx = createInitialContext({
      language: "hi",
      ...advice.earlyResult?.contextPatch,
    });
    const search = planTurn("Fortune oil", ctx);
    expect(search.toolCalls[0]?.name).toBe("searchProducts");
    expect(String(search.toolCalls[0]?.args.keyword)).toMatch(/fortune oil/i);
  });
});
