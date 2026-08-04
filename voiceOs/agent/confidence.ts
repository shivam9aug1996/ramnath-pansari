export const CONFIDENCE_CLARIFY_THRESHOLD = 0.8;

const GROCERYISH =
  /\b(oil|tel|atta|aata|flour|sugar|chini|dal|rice|chawal|milk|doodh|ghee|salt|namak|tea|chai|honey|shahad|soap|detergent|biscuits?|namkeen|masala|spice|powder|wheat|mustard|sarso|sarson|sunflower|coconut|nariyal|toor|arhar|moong|chana|besan|maida|poha|noodles?|pasta|juice|butter|curd|dahi|paneer|eggs?|ande?|bread|pav|ketchup|sauce|pickle|achar|haldi|jeera|mirch|turmeric|cumin|basmati|fortune|patanjali|aashirvaad|tata|dabur|amul|saffola|parle|maggi|nestle|india\s*gate|mother\s*dairy|good\s*life|zandu|sacha|moti)\b/i;

export function isGroceryishKeyword(keyword: string): boolean {
  return GROCERYISH.test(keyword);
}

/**
 * Confidence for initiating a catalog search.
 * Non-grocery phrases without size/add stay LOW so we clarify / LLM — never default-search.
 */
export function scoreSearchConfidence(params: {
  keyword: string;
  preferSize: string | null;
  intentAdd: boolean;
  groceryish?: boolean;
}): number {
  const { keyword, preferSize, intentAdd } = params;
  const groceryish =
    params.groceryish ?? isGroceryishKeyword(keyword);
  const len = keyword.trim().length;

  if (groceryish) return 0.95;
  if (preferSize) return 0.9;
  if (intentAdd) return 0.88;
  if (len < 3) return 0.3;
  if (len < 5) return 0.45;
  // Unknown brand / non-grocery utterance — not high enough to auto-search
  return 0.55;
}

/**
 * Confidence for resolving a product from last-search options.
 * Index picks and single matches are high; multi-match is low → clarify.
 */
export function scoreProductPickConfidence(params: {
  matchCount: number;
  optionCount: number;
  usedIndex: boolean;
}): number {
  const { matchCount, usedIndex } = params;
  if (matchCount === 1) return usedIndex ? 0.98 : 0.92;
  if (matchCount === 0) return 0.0;
  return 0.35;
}
