/**
 * Suite 1 — Conversation (no shopping)
 * Suite 6 — Negative / non-grocery utterances
 *
 * Expectation: never searchProducts, never addToCart, never set pendingConfirmation.
 */
import { executeTool } from "@/voiceOs/toolExecutor";
import { planTurn } from "@/voiceOs/agent/localAgent";
import { createInitialContext } from "@/voiceOs/types";
import {
  installDefaultCatalogMock,
  loggedInSession,
  qaDeps,
  runScript,
} from "./qaHarness";
import { handleUserMessage } from "@/voiceOs/conversationManager";
import { mergeSession } from "./qaHarness";

jest.mock("@/voiceOs/toolExecutor", () => ({
  executeTool: jest.fn(),
}));

jest.mock("@/voiceOs/agent/llmClient", () => ({
  isShopAssistLlmEnabled: () => false,
  callShopAssistLlm: jest.fn(),
}));

const mockedExecute = executeTool as jest.MockedFunction<typeof executeTool>;

const NO_SHOP = {
  tools: [] as string[],
  toolsNot: ["searchProducts", "addToCart"],
  pendingConfirmation: false as const,
  messageNotMatch: /Found top|Mil gaya \d/i,
};

describe("QA Suite 1 — Conversation (no shopping)", () => {
  beforeEach(() => {
    mockedExecute.mockReset();
    installDefaultCatalogMock(mockedExecute);
  });

  const cases: Array<{ user: string; messageMatch: RegExp }> = [
    { user: "Hi", messageMatch: /Namaste|Hello/i },
    { user: "Hello", messageMatch: /Namaste|Hello/i },
    { user: "Kaise ho?", messageMatch: /badhiya|well|Main/i },
    { user: "Are you okay?", messageMatch: /badhiya|well|Main|ok/i },
    { user: "Thanks", messageMatch: /bilkul|welcome|Ji/i },
    { user: "Bye", messageMatch: /Alvida|Bye/i },
    { user: "Good night", messageMatch: /Alvida|Bye|night/i },
    { user: "Happy Diwali", messageMatch: /Shukriya|Thank|shubhkamnayein|same/i },
    { user: "Tum kaun ho?", messageMatch: /Shop Assist/i },
    { user: "Help", messageMatch: /Shop Assist|grocery|product/i },
  ];

  it.each(cases)("$user — reply only, no tools", async ({ user, messageMatch }) => {
    await runScript(mockedExecute, [
      {
        user,
        assert: {
          ...NO_SHOP,
          phase: "idle",
          messageMatch,
        },
      },
    ]);
    expect(mockedExecute).not.toHaveBeenCalled();
  });

  it("multi-turn conversation never mutates cart or confirmation", async () => {
    const session = await runScript(mockedExecute, [
      { user: "Hi", assert: NO_SHOP },
      { user: "Kaise ho?", assert: NO_SHOP },
      { user: "Thanks", assert: NO_SHOP },
      { user: "Bye", assert: { ...NO_SHOP, messageMatch: /Alvida|Bye/i } },
    ]);
    expect(session.cartItemCount).toBe(0);
    expect(session.pendingConfirmation).toBeNull();
    expect(session.pendingQuantity).toBe(false);
    expect(mockedExecute).not.toHaveBeenCalled();
  });
});

describe("QA Suite 6 — Negative cases", () => {
  beforeEach(() => {
    mockedExecute.mockReset();
    installDefaultCatalogMock(mockedExecute);
  });

  const clarifyCases = [
    "asdfasdf",
    "....",
    "?????",
    "123456",
    "I want happiness",
    "What's today's weather?",
  ];

  it.each(clarifyCases)("%s — clarify, never search", async (user) => {
    const planned = planTurn(user, createInitialContext({ language: "en" }));
    expect(planned.toolCalls).toHaveLength(0);
    expect(planned.toolCalls.find((t) => t.name === "addToCart")).toBeUndefined();
    expect(planned.earlyResult?.assistantMessage).toBeTruthy();
    expect(planned.earlyResult?.assistantMessage).not.toMatch(/Found top/i);

    const result = await handleUserMessage(user, loggedInSession(), qaDeps);
    expect(mockedExecute).not.toHaveBeenCalled();
    expect(result.toolCalls).toHaveLength(0);
    expect(mergeSession(loggedInSession(), result).pendingConfirmation).toBeNull();
  });

  it("decline phrases never search", async () => {
    await runScript(mockedExecute, [
      {
        user: "namaste",
        assert: NO_SHOP,
      },
      {
        user: "Nothing today",
        assert: {
          ...NO_SHOP,
          messageMatch: /Theek|problem|Jab bhi|Whenever/i,
        },
      },
      {
        user: "hi",
        assert: NO_SHOP,
      },
      {
        user: "I don't need anything",
        assert: {
          ...NO_SHOP,
          messageMatch: /Theek|problem|Jab bhi|Whenever/i,
        },
      },
    ]);
  });
});
