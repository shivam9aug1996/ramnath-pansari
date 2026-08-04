/**
 * Store category browse — list categories, then drill into spices/oil/etc.
 * Distinct from keyword search ("masala" → Masala Oats).
 */
import type { ConversationContext } from "../types";

export type StoreCategoryId =
  | "atta"
  | "rice"
  | "dal"
  | "oil"
  | "masala"
  | "sugar"
  | "snacks"
  | "dairy"
  | "tea"
  | "personal_care";

export type StoreCategory = {
  id: StoreCategoryId;
  /** Search / broad-clarify keyword */
  keyword: string;
  labels: string[];
  labelEn: string;
  labelHi: string;
  /** If set, use broad-category clarify instead of immediate search */
  useBroadClarify?: boolean;
};

export const STORE_CATEGORIES: StoreCategory[] = [
  {
    id: "atta",
    keyword: "atta",
    labels: ["atta", "aata", "flour"],
    labelEn: "Atta / Flour",
    labelHi: "Atta",
  },
  {
    id: "rice",
    keyword: "rice",
    labels: ["rice", "chawal", "basmati"],
    labelEn: "Rice / Chawal",
    labelHi: "Chawal / Rice",
  },
  {
    id: "dal",
    keyword: "dal",
    labels: ["dal", "daal", "pulses"],
    labelEn: "Dal",
    labelHi: "Dal",
  },
  {
    id: "oil",
    keyword: "oil",
    labels: ["oil", "oils", "tel"],
    labelEn: "Oils",
    labelHi: "Tel / Oil",
    useBroadClarify: true,
  },
  {
    id: "masala",
    keyword: "masala",
    labels: ["masala", "masale", "spice", "spices", "masalae"],
    labelEn: "Masale / Spices",
    labelHi: "Masale",
    useBroadClarify: true,
  },
  {
    id: "sugar",
    keyword: "sugar",
    labels: ["sugar", "chini", "cheeni"],
    labelEn: "Sugar",
    labelHi: "Chini",
  },
  {
    id: "snacks",
    keyword: "namkeen",
    labels: ["snacks", "namkeen", "biscuit", "biscuits"],
    labelEn: "Snacks",
    labelHi: "Snacks / Namkeen",
  },
  {
    id: "dairy",
    keyword: "milk",
    labels: ["dairy", "milk", "doodh", "ghee", "dahi", "curd", "butter"],
    labelEn: "Dairy",
    labelHi: "Dairy / Doodh",
  },
  {
    id: "tea",
    keyword: "tea",
    labels: ["tea", "chai", "beverages", "beverage"],
    labelEn: "Tea / Beverages",
    labelHi: "Chai / Tea",
  },
  {
    id: "personal_care",
    keyword: "soap",
    labels: ["personal care", "personalcare", "shampoo", "toothpaste", "soap"],
    labelEn: "Personal Care",
    labelHi: "Personal Care",
  },
];

/** Normalize vernacular / plural category tokens before broad clarify or search. */
export function normalizeCategoryKeyword(keyword: string): string {
  const k = keyword.trim().toLowerCase().replace(/[?!.,]/g, "");
  const map: Record<string, string> = {
    masale: "masala",
    masalae: "masala",
    spices: "masala",
    spice: "masala",
    oils: "oil",
    tel: "oil",
    aata: "atta",
    flour: "atta",
    chawal: "rice",
    daal: "dal",
    pulses: "dal",
    chini: "sugar",
    cheeni: "sugar",
    biscuits: "biscuit",
    namkeens: "namkeen",
  };
  return map[k] ?? k;
}

export function matchStoreCategory(text: string): StoreCategory | null {
  const t = text
    .trim()
    .toLowerCase()
    .replace(/[?!.,]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return null;
  const normalized = normalizeCategoryKeyword(t);
  for (const cat of STORE_CATEGORIES) {
    if (cat.id === normalized || cat.keyword === normalized) return cat;
    if (cat.labels.some((l) => l === t || l === normalized)) return cat;
  }
  // "masale wali" / "oil category"
  for (const cat of STORE_CATEGORIES) {
    if (cat.labels.some((l) => t === l || t.startsWith(`${l} `))) return cat;
  }
  return null;
}

export function isCategoryCatalogQuestion(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  // Never steal cart / checkout phrasing
  if (
    /\b(cart|basket|checkout|payment|order|bill|total)\b/i.test(t) ||
    /\b(cart|basket)\s*(me|mein|m|ka|ki|ke)\b/i.test(t)
  ) {
    return false;
  }
  if (
    /\b(categor(y|ies)|sections?|aisles?|departments?)\b/i.test(t) &&
    /\b(what|which|kya|kaunsi|konsi|list|show|have|hai|hain|available|sell)\b/i.test(
      t,
    )
  ) {
    return true;
  }
  if (
    /\b(what\s+do\s+you\s+(have|sell)|what\s+(all\s+)?(do\s+you\s+)?(have|sell)|aapke?\s+paas\s+kya\s+(kya\s+)?(hai|hain|milta|milega)|kya\s+available)\b/i.test(
      t,
    )
  ) {
    return true;
  }
  // Standalone "kya kya hai" / "kya milta hai" without cart — store inventory ask
  if (
    /^(kya\s+kya\s+(hai|hain|milta|milega)|kya\s+mil(ta|ega)|kya\s+kya\s+mil(ta|ega))(\s+(yahan|store|shop|yaha))?$/i.test(
      t,
    )
  ) {
    return true;
  }
  if (
    /^(categories|category|kya\s+categories)\??$/i.test(t) ||
    /^what\s+categories\b/i.test(t)
  ) {
    return true;
  }
  return false;
}

export function buildCategoryListMessage(
  context: ConversationContext,
  hi: boolean,
): string {
  const name = context.customerName ? `, ${context.customerName}` : "";
  const lines = STORE_CATEGORIES.map(
    (c, i) => `${i + 1}. ${hi ? c.labelHi : c.labelEn}`,
  ).join("\n");
  return hi
    ? `Humare paas yeh categories hain${name}:\n${lines}\nKaunsi category chahiye? Naam ya number bolo.`
    : `We have these grocery categories${name}:\n${lines}\nWhich category? Say a name or number.`;
}

export function matchCategoryListSelection(
  text: string,
): StoreCategory | null {
  const t = text.trim().toLowerCase();
  const num = t.match(/^(\d+)\s*[.)]?$/);
  if (num) {
    const idx = Number(num[1]) - 1;
    if (idx >= 0 && idx < STORE_CATEGORIES.length) {
      return STORE_CATEGORIES[idx];
    }
  }
  return matchStoreCategory(text);
}
