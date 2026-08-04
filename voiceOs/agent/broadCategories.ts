/**
 * Broad grocery categories that match too many SKUs — clarify before search.
 */
import type { AgentTurnResult, ConversationContext, ShopIntent } from "../types";
import { normalizeCategoryKeyword } from "./storeCategories";

const BROAD_CATEGORIES: Record<
  string,
  { label: string; options: string[]; labelsHi: string[] }
> = {
  powder: {
    label: "powder",
    options: [
      "talcum powder",
      "turmeric powder",
      "coriander powder",
      "cocoa powder",
    ],
    labelsHi: [
      "Talcum powder",
      "Haldi (turmeric) powder",
      "Dhaniya (coriander) powder",
      "Cocoa powder",
    ],
  },
  masala: {
    label: "masala",
    options: [
      "turmeric powder",
      "red chilli powder",
      "coriander powder",
      "cumin",
      "garam masala",
      "hing",
    ],
    labelsHi: [
      "Haldi (turmeric)",
      "Lal mirch",
      "Dhaniya powder",
      "Jeera",
      "Garam masala",
      "Hing",
    ],
  },
  oil: {
    label: "oil",
    options: [
      "mustard oil",
      "sunflower oil",
      "rice bran oil",
      "groundnut oil",
      "coconut oil",
    ],
    labelsHi: [
      "Sarso (mustard) oil",
      "Sunflower oil",
      "Rice bran oil",
      "Groundnut oil",
      "Coconut oil",
    ],
  },
};

export function getBroadCategoryClarify(
  keyword: string,
): { label: string; options: string[]; labelsHi: string[] } | null {
  const key = normalizeCategoryKeyword(keyword);
  return BROAD_CATEGORIES[key] ?? null;
}

export type BroadClarifyTurn = {
  toolCalls: [];
  earlyResult: AgentTurnResult;
  sessionPatch: Record<string, never>;
  intent: ShopIntent;
  confidence: number;
};

/** Shared broad-category clarify turn (tool planner + category-list pick). */
export function buildBroadCategoryClarifyTurn(
  keyword: string,
  hi: boolean,
  langPatch: Partial<ConversationContext> = {},
): BroadClarifyTurn | null {
  const broad = getBroadCategoryClarify(keyword);
  if (!broad) return null;
  const display = hi ? broad.labelsHi : broad.options;
  const options = display.map((o, i) => `${i + 1}. ${o}`).join("\n");
  return {
    toolCalls: [],
    earlyResult: {
      assistantMessage: hi
        ? `Kaunsa ${broad.label} chahiye?\n${options}\nNaam ya number bolo.`
        : `Which ${broad.label} do you want?\n${options}\nSay a name or number.`,
      toolCalls: [],
      toolResults: [],
      contextPatch: {
        ...langPatch,
        lastAssistantPromptType: "broad_category",
        pendingBroadOptions: broad.options,
      },
      uiAction: null,
    },
    sessionPatch: {},
    intent: "clarify",
    confidence: 0.85,
  };
}
