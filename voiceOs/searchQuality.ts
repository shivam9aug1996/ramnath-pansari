import type { SessionProduct } from "./types";

/** Grocery category tokens — not treated as brand for ranking boosts. */
const CATEGORY_TOKENS = new Set([
  "oil",
  "tel",
  "sugar",
  "chini",
  "cheeni",
  "rice",
  "chawal",
  "dal",
  "daal",
  "atta",
  "aata",
  "milk",
  "doodh",
  "salt",
  "namak",
  "tea",
  "chai",
  "flour",
  "ghee",
  "butter",
  "curd",
  "dahi",
  "eggs",
  "anda",
  "turmeric",
  "haldi",
  "cumin",
  "jeera",
  "besan",
  "mustard",
  "sunflower",
  "groundnut",
  "coconut",
  "refined",
  "packet",
  "loose",
]);

const TOKEN_SYNONYMS: Record<string, string> = {
  chini: "sugar",
  cheeni: "sugar",
  chawal: "rice",
  chaawal: "rice",
  daal: "dal",
  aata: "atta",
  doodh: "milk",
  namak: "salt",
  haldi: "turmeric",
  jeera: "cumin",
  dahi: "curd",
  anda: "eggs",
  makhan: "butter",
  chai: "tea",
};

export function sizeMatchesProduct(
  product: SessionProduct,
  sizeHint: string,
): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/litres?|liters?|ltr/g, "l")
      .replace(/grams?|gms?/g, "g")
      .replace(/kgs?/g, "kg");

  const want = norm(sizeHint);
  const candidates = [product.size ?? "", product.name ?? ""].map(norm);
  return candidates.some(
    (c) => c.includes(want) || want.includes(c.replace(/[^0-9a-z.]/g, "")),
  );
}

/**
 * Client-side vernacular shortcuts until API synonym deploy propagates.
 * Preserves brand prefixes: "patanjali sarso tel" → "patanjali mustard oil".
 */
export function rewriteSearchKeyword(keyword: string): string {
  let k = keyword.replace(/\btek\b/gi, "tel").replace(/\s+/g, " ").trim();
  if (!k) return k;

  // Phrase-level mustard rewrite — keep surrounding brand words
  if (/\b(sarso|sarson)\b/i.test(k) && /\b(tel|oil)\b/i.test(k)) {
    k = k
      .replace(/\b(sarso|sarson)\s*(ka\s*)?(tel|oil)\b/gi, "mustard oil")
      .replace(/\s+/g, " ")
      .trim();
  } else if (/^(sarso|sarson)$/i.test(k)) {
    return "mustard oil";
  }

  // Exact whole-keyword shortcuts
  if (/^chai$/i.test(k)) return "tea"; // never touch chahiye (stripped before search)
  if (/^(chini|cheeni)$/i.test(k)) return "sugar";
  if (/^(chawal|chaawal)$/i.test(k)) return "rice";
  if (/^(daal|dal)$/i.test(k)) return "dal";
  if (/^(atta|aata)$/i.test(k)) return "atta";
  if (/^doodh$/i.test(k)) return "milk";
  if (/^namak$/i.test(k)) return "salt";
  if (/^haldi$/i.test(k)) return "turmeric";
  if (/^jeera$/i.test(k)) return "cumin";
  if (/^dahi$/i.test(k)) return "curd";
  if (/^anda$/i.test(k)) return "eggs";
  if (/^makhan$/i.test(k)) return "butter";

  // Rewrite vernacular tokens inside multi-word queries ("loose chini" → "loose sugar")
  const parts = k.split(/\s+/);
  const rewritten = parts.map((part) => {
    const lower = part.toLowerCase();
    if (TOKEN_SYNONYMS[lower]) return TOKEN_SYNONYMS[lower];
    return part;
  });
  return rewritten.join(" ").replace(/\s+/g, " ").trim();
}

export type RankOptions = {
  preferSize?: string | null;
};

/**
 * Prefer in-stock, size match, brand tokens; demote sugar-free noise for plain sugar queries.
 */
export function rankSearchProducts(
  products: SessionProduct[],
  keyword: string,
  options: RankOptions = {},
): SessionProduct[] {
  const preferSize = options.preferSize ?? null;
  const RANK_STOP = new Set([
    "to",
    "of",
    "and",
    "or",
    "the",
    "for",
    "in",
    "with",
    "on",
    "at",
    "by",
    "from",
    "ready",
    "eat",
    "pack",
    "packet",
  ]);
  const tokens = keyword
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !RANK_STOP.has(t));
  const brandTokens = tokens.filter((t) => !CATEGORY_TOKENS.has(t));
  const wantsPlainSugar =
    /\b(sugar|chini|cheeni)\b/i.test(keyword) &&
    !/\b(zero\s*sugar|sugar\s*free|no\s*sugar)\b/i.test(keyword);

  const score = (p: SessionProduct) => {
    let s = 0;
    if (!p.isOutOfStock) s += 100;
    const name = (p.name ?? "").toLowerCase();
    const nameTokens = name.split(/\s+/);

    for (const t of tokens) {
      if (name.includes(t)) s += 10;
    }

    for (const t of brandTokens) {
      // Exact brand as first token of product name — strong signal
      if (nameTokens[0] === t) {
        s += 80;
      } else if (
        name.startsWith(t) ||
        new RegExp(`\\b${escapeRe(t)}\\b`, "i").test(name)
      ) {
        s += 25;
      }
    }

    if (preferSize && sizeMatchesProduct(p, preferSize)) {
      s += 50;
    }

    if (
      wantsPlainSugar &&
      /\b(zero\s*sugar|sugar\s*free|no\s*sugar|stevia)\b/i.test(name)
    ) {
      s -= 40;
    }

    return s;
  };

  return [...products].sort((a, b) => score(b) - score(a));
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
