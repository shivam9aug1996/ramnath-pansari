import {
  isChitchat,
  isConversationIntent,
  isAffirm,
  wantsCheckout,
  GREETING_ONLY,
  OPEN_CART_HINTS,
  LIST_CART_HINTS,
  CART_TOTAL_HINTS,
  CLEAR_CART_HINTS,
  DENY,
  SEARCH_HINTS,
  isShoppingDecline,
  isShoppingAdvice,
} from "./intentPlanner";

/**
 * Strip conversational / shopping fillers so catalog search gets clean keywords.
 * "I want to buy Fortune" → "Fortune"
 */
function stripSearchNoise(text: string): string {
  return text
    .replace(
      /\b(please|pls|kya|hai|hain|he|ho|hu|hun|hoon|mujhe|mujhko|mujheko|mere|mera|meri|ko|se|ke|ki|ka|do|doo|kar|karo|kar\s*do|daal\s*do|dal\s*do|add\s*karo|add\s*kar\s*do|add|search|find|dhundo|dikhao|dikha|chahiye|chahie|chaiye|chahye|product|item|for|the|a|an|some|want|wanna|would|like|need|buy|purchase|kharidna|kharidne|kharedne|khareedna|kharid|lena|leni|lenge|mangwa|mangwao|order|shopping|cart|basket|mein|me|krdo|kardo|kar\s*do|can|you|get|give|show|bring|have|got|looking|look)\b/gi,
      " ",
    )
    // Pronouns / infinitive "to" left after "want to buy"
    .replace(
      /\b(i|i'?m|am|is|are|was|were|my|we|us|our|it|this|that|just|also|only|really|very|actually|basically|perhaps|maybe)\b/gi,
      " ",
    )
    .replace(/\bto\b/gi, " ")
    .replace(/\btek\b/gi, "tel")
    // Size: "1l", "500 ml", "1 kg"
    .replace(/\b(\d+(?:\.\d+)?)\s*(l|ltr|liter|litre|ml|kg|g|gm|grams?)\b/gi, " ")
    // Qty phrases: "3 quantity", "qty 3", "2 pcs" — not product names
    .replace(
      /\b(?:qty|quantity)\s*[:=]?\s*\d+\b|\b\d+\s*(?:qty|quantity|pcs?|pieces?|packets?|units?)\b/gi,
      " ",
    )
    .replace(/\b(qty|quantity)\b/gi, " ")
    // Trailing bare number after product ("fortune oil 3")
    .replace(/\s+\d+\s*$/g, " ")
    .replace(/[?!.,']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Known grocery brands — brand-only queries should clarify category. */
export const KNOWN_BRANDS = new Set([
  "fortune",
  "patanjali",
  "aashirvaad",
  "aashirvad",
  "ashirwad",
  "ashirvaad",
  "tata",
  "dabur",
  "amul",
  "saffola",
  "parle",
  "maggi",
  "nestle",
  "zandu",
  "dhara",
  "godrej",
  "mtr",
  "yogabar",
  "sacha",
  "moti",
]);

export function isBrandOnlyKeyword(keyword: string): boolean {
  const parts = keyword
    .toLowerCase()
    .replace(/[?!.,']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length !== 1) return false;
  return KNOWN_BRANDS.has(parts[0]);
}

/** Parse size like 1l, 1 L, 5kg from user text. */
export function parseSizeHint(text: string): string | null {
  const m = text.match(
    /\b(\d+(?:\.\d+)?)\s*(l|ltr|liter|litre|ml|kg|g|gm|grams?)\b/i,
  );
  if (!m) return null;
  const n = m[1];
  const u = m[2].toLowerCase();
  if (u === "ml") return `${n}ml`;
  if (u.startsWith("l")) return `${n}l`;
  if (u.startsWith("k")) return `${n}kg`;
  return `${n}g`;
}

/**
 * Parse "5", "5 and 7", "5,7", "5 aur 7" → 0-based indices into the options list.
 * Returns [] if the text looks like a normal product query (has real words).
 */
export function parseProductIndices(text: string, optionCount: number): number[] {
  const t = text.trim().toLowerCase();
  if (!t || optionCount <= 0) return [];

  const withoutJoiners = t.replace(/\b(and|aur|or|ya|&|,|\/)\b/gi, " ");
  const leftoverLetters = withoutJoiners.replace(/\d+/g, " ").replace(/\s+/g, " ").trim();
  // If user typed real words, this is not an index pick (e.g. "5 kg oil")
  if (/[a-z\u0900-\u097F]{3,}/i.test(leftoverLetters)) {
    return [];
  }

  const nums = Array.from(t.matchAll(/\d+/g), (m) => Number(m[0]));
  const indices: number[] = [];
  const seen = new Set<number>();
  for (const n of nums) {
    if (n >= 1 && n <= optionCount && !seen.has(n)) {
      seen.add(n);
      indices.push(n - 1);
    }
  }
  return indices;
}

export function extractSearchKeyword(text: string): string | null {
  const multi = parseMultiProductQuery(text);
  if (multi && multi.keywords.length >= 1) return multi.keywords[0];
  return null;
}

/** Multi-word grocery phrases (longest first). */
const GROCERY_PHRASES = [
  "hide and seek",
  "hide & seek",
  "sarso ka tel",
  "sarson ka tel",
  "mustard oil",
  "coconut oil",
  "refined oil",
  "cooking oil",
  "chakki atta",
  "wheat atta",
  "whole wheat",
  "toor dal",
  "moong dal",
  "masoor dal",
  "chana dal",
  "urad dal",
  "black salt",
  "rock salt",
  "bread and butter",
];

/**
 * Protect brand phrases that contain "and"/"&" so we don't split them.
 */
export function shieldAndPhrases(text: string): {
  text: string;
  restore: (s: string) => string;
} {
  const map = new Map<string, string>();
  let i = 0;
  let out = text;
  const shields = [
    "hide and seek",
    "hide & seek",
    "bread and butter",
    "parle g",
    "parle-g",
    "parle & g",
  ];
  for (const phrase of shields) {
    const re = new RegExp(
      phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"),
      "gi",
    );
    out = out.replace(re, (match) => {
      const key = `__PHRASE${i++}__`;
      map.set(key, match);
      return key;
    });
  }
  return {
    text: out,
    restore: (s: string) => {
      let r = s;
      for (const [key, val] of map) {
        r = r.replace(new RegExp(key, "g"), val);
      }
      return r;
    },
  };
}

/** Single-token grocery categories users often list without "and". */
const GROCERY_TOKENS = new Set([
  "dal",
  "daal",
  "chawal",
  "chaawal",
  "rice",
  "chini",
  "cheeni",
  "sugar",
  "atta",
  "tel",
  "oil",
  "doodh",
  "milk",
  "namak",
  "salt",
  "mirch",
  "haldi",
  "jeera",
  "besan",
  "maida",
  "suji",
  "rava",
  "poha",
  "sev",
  "papad",
  "ghee",
  "makhan",
  "butter",
  "curd",
  "dahi",
  "paneer",
  "eggs",
  "anda",
  "bread",
  "chai",
  "tea",
  "coffee",
  "biscuit",
  "biscuits",
  "namkeen",
  "noodles",
  "pasta",
  "sauce",
  "vinegar",
  "honey",
  "jam",
  "pickle",
  "achaar",
  "achar",
]);

/**
 * Brand-aware split: "sacha moti dal chawal" → ["sacha moti dal", "chawal"].
 */
export function extractGroceryListWithBrands(text: string): string[] {
  let remaining = ` ${text.toLowerCase().replace(/[?!.,']/g, " ")} `;

  if (/\bhide\s*(and|&)\s*seek\b/i.test(remaining)) {
    const cleaned = remaining.replace(/\s+/g, " ").trim();
    return cleaned ? [cleaned] : [];
  }

  const phraseHits: { start: number; end: number; value: string }[] = [];
  const phrases = [...GROCERY_PHRASES].sort((a, b) => b.length - a.length);
  for (const phrase of phrases) {
    if (phrase.startsWith("hide")) continue;
    const localRe = new RegExp(`\\s${phrase.replace(/\s+/g, "\\s+")}\\s`, "gi");
    let m: RegExpExecArray | null;
    while ((m = localRe.exec(remaining)) != null) {
      phraseHits.push({
        start: m.index,
        end: m.index + m[0].length,
        value: phrase,
      });
    }
  }

  let work = remaining;
  const placeholders: string[] = [];
  for (const hit of phraseHits.sort((a, b) => b.start - a.start)) {
    const key = ` __PH${placeholders.length}__ `;
    placeholders.push(hit.value);
    work = work.slice(0, hit.start) + key + work.slice(hit.end);
  }

  const tokens = work
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const products: string[] = [];
  let prefix: string[] = [];

  const flushProduct = (core: string) => {
    const parts = [...prefix, core].filter(Boolean);
    prefix = [];
    const joined = parts.join(" ").replace(/\s+/g, " ").trim();
    if (joined) products.push(joined);
  };

  for (const tok of tokens) {
    const ph = tok.match(/^__PH(\d+)__$/i);
    if (ph) {
      flushProduct(placeholders[Number(ph[1])] ?? tok);
      continue;
    }
    if (GROCERY_TOKENS.has(tok.toLowerCase())) {
      flushProduct(tok);
      continue;
    }
    prefix.push(tok);
  }

  if (products.length === 0) return [];
  if (prefix.length > 0) {
    products[products.length - 1] =
      `${products[products.length - 1]} ${prefix.join(" ")}`.trim();
  }

  const seen = new Set<string>();
  return products.filter((p) => {
    const key = p.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Alias — brand-aware list. */
export function extractGroceryList(text: string): string[] {
  return extractGroceryListWithBrands(text);
}

export type MultiProductQuery = {
  keywords: string[];
  needsConfirm: boolean;
  fullPhrase: string;
};

/**
 * Explicit and/aur → multi without confirm.
 * Implicit "dal chawal" / "sacha moti dal chawal" → needsConfirm.
 */
export function parseMultiProductQuery(text: string): MultiProductQuery | null {
  let trimmed = text.trim();
  trimmed = trimmed.replace(
    /^(hi|hello|hey|namaste|namaskar|hii+)\b[\s,]*/i,
    "",
  );
  if (
    !trimmed ||
    GREETING_ONLY.test(text.trim()) ||
    isConversationIntent(text.trim()) ||
    isChitchat(text.trim()) ||
    isShoppingDecline(text.trim()) ||
    isShoppingAdvice(text.trim()) ||
    OPEN_CART_HINTS.test(trimmed) ||
    LIST_CART_HINTS.test(trimmed) ||
    CART_TOTAL_HINTS.test(trimmed) ||
    CLEAR_CART_HINTS.test(trimmed) ||
    wantsCheckout(trimmed) ||
    isAffirm(trimmed) ||
    DENY.test(trimmed)
  ) {
    return null;
  }

  const quoted = trimmed.match(/["'](.+?)["']/);
  if (quoted?.[1]) {
    return {
      keywords: [quoted[1].trim()],
      needsConfirm: false,
      fullPhrase: quoted[1].trim(),
    };
  }

  const afterSearch = trimmed.match(
    /(?:search|find|dhundo|dikhao)\s+(?:for\s+)?(.+)$/i,
  );
  const body = afterSearch?.[1] ?? trimmed;
  const fullPhrase =
    stripSearchNoise(body) || body.replace(/\s+/g, " ").trim();

  const hadExplicitJoin = /\s+(?:and|aur|&)\s+|,\s*(?=[\w\u0900-\u097F])/i.test(
    shieldAndPhrases(body).text,
  );

  const shielded = shieldAndPhrases(body);
  const rawParts = shielded.text
    .split(/\s+(?:and|aur|&)\s+|,\s*(?=[\w\u0900-\u097F])/i)
    .map((p) => shielded.restore(p.trim()))
    .filter(Boolean);

  const keywords: string[] = [];
  const seen = new Set<string>();
  const pushKw = (kw: string) => {
    const cleaned = kw.replace(/\s+/g, " ").trim();
    if (cleaned.length < 2) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    keywords.push(cleaned);
  };

  for (const part of rawParts) {
    const cleaned = stripSearchNoise(part);
    pushKw(cleaned.length >= 2 ? cleaned : part);
  }

  if (hadExplicitJoin && keywords.length >= 2) {
    return { keywords, needsConfirm: false, fullPhrase };
  }

  const groceryList = extractGroceryListWithBrands(fullPhrase || body);
  if (groceryList.length >= 2) {
    return {
      keywords: groceryList,
      needsConfirm: true,
      fullPhrase: fullPhrase || groceryList.join(" "),
    };
  }

  if (keywords.length >= 1) {
    return {
      keywords,
      needsConfirm: false,
      fullPhrase: keywords[0],
    };
  }

  const cleaned = stripSearchNoise(trimmed);
  if (cleaned.length >= 2) {
    return { keywords: [cleaned], needsConfirm: false, fullPhrase: cleaned };
  }
  if (SEARCH_HINTS.test(trimmed) && trimmed.length >= 3) {
    const fallback = stripSearchNoise(trimmed);
    return fallback
      ? { keywords: [fallback], needsConfirm: false, fullPhrase: fallback }
      : null;
  }
  return null;
}

export function parseMultiProductKeywords(text: string): string[] {
  return parseMultiProductQuery(text)?.keywords ?? [];
}

const QTY_WORDS: Record<string, number> = {
  ek: 1,
  one: 1,
  "1": 1,
  do: 2,
  two: 2,
  "2": 2,
  teen: 3,
  three: 3,
  "3": 3,
  char: 4,
  four: 4,
  "4": 4,
  paanch: 5,
  panch: 5,
  five: 5,
  "5": 5,
};

export function parseQuantity(text: string): number | null {
  const t = text
    .trim()
    .toLowerCase()
    .replace(
      /\b(please|pls|ji|packets?|pcs?|pieces?|units?|quantity|qty)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
  if (QTY_WORDS[t] != null) return QTY_WORDS[t];
  const m = t.match(
    /^(\d+)\s*(pcs?|pieces?|packet|packets|kg|g|l|ml|unit|units)?\.?$/i,
  );
  if (m) return Number(m[1]);
  // "2 packet chahiye" / leftover after filler strip
  const m2 = t.match(/^(\d+)\b/);
  if (m2 && t.length <= 24) return Number(m2[1]);
  // Hindi qty word + leftover junk already stripped
  const word = t.split(/\s+/)[0];
  if (word && QTY_WORDS[word] != null) return QTY_WORDS[word];
  return null;
}

/** Quantity for one-shot add — ignore size tokens like 1l. */
export function parseAddQuantity(text: string): number | null {
  const { DEFAULT_MAX_CART_QTY } = require("../types");
  const withoutSize = text
    .replace(
      /\b\d+(?:\.\d+)?\s*(l|ltr|liter|litre|ml|kg|g|gm|grams?)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

  // Prefer explicit "3 quantity" / "qty 3" / "2 pcs"
  const explicit = withoutSize.match(
    /\b(?:qty|quantity)\s*[:=]?\s*(\d+)\b|\b(\d+)\s*(?:qty|quantity|pcs?|pieces?|packets?|units?)\b/i,
  );
  if (explicit) {
    const n = Number(explicit[1] || explicit[2]);
    if (n >= 1 && n <= DEFAULT_MAX_CART_QTY) return n;
  }

  const fromRest = parseQuantity(withoutSize);
  if (fromRest != null) return fromRest;

  // Mid-sentence number after size stripped ("add fortune oil 3")
  const m = withoutSize.match(/\b(\d+)\b/);
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= DEFAULT_MAX_CART_QTY) return n;
  }
  return null;
}

/** Keywords that commonly carry a size hint (1l oil, 5kg atta). */
export function keywordLooksSizeful(keyword: string): boolean {
  return /\b(oil|tel|atta|aata|milk|doodh|ghee|flour|sarso|sarson|mustard|sunflower|groundnut|coconut)\b/i.test(
    keyword,
  );
}

export function preferSizeForKeyword(
  keyword: string,
  sizeHint: string | null,
  allKeywords: string[],
): string | null {
  if (!sizeHint) return null;
  // Single-product utterance: always honor size ("chini 1kg", "oil 1l")
  if (allKeywords.length <= 1) return sizeHint;
  // Multi-buy: only oil/atta-like legs get the size hint
  if (keywordLooksSizeful(keyword)) return sizeHint;
  return null;
}
