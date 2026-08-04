import type { ConversationContext, ShopIntent } from "../types";

export const SEARCH_HINTS =
  /\b(search|find|dhundo|dikhao|chahiye|add|daal|dal|mangwa|order|product|item)\b/i;

/** Open native cart screen — only when user asks for the page/screen. */
export const OPEN_CART_HINTS =
  /\b((open|kholo|khol)\s+(my\s+)?(cart|basket)\s*(page|screen)?|(cart|basket)\s*(page|screen)\s*(open|kholo|khol|karo|kardo)?|(cart|basket)\s*(page|screen|pe|par)\s*(jao|chalo|kholo|open|le\s*jao)|go\s+to\s+(my\s+)?(cart|basket)|cart\s*page\s*open)\b/i;

/** List cart inline in Voice OS — "cart dikhao", "kya hai", etc. */
export const LIST_CART_HINTS =
  /\b((cart|basket).{0,24}\b(kya|what|items|list|dikhao|dikha|batao|bata|show)\b|\b(kya|what|show|dikhao|dikha).{0,24}\b(cart|basket)\b|abhi\s+(mera\s+)?cart\s*me|cart\s*me\s*kya|cart\s*mein\s*kya|mere\s*cart\s*me\s*(kya)?|(mera\s+)?(cart|basket)\s*dikhao)\b/i;

export const CART_TOTAL_HINTS =
  /\b(total\s*amount|bill\s*amount|grand\s*total|payable|cart\s*total|total\s*kitn|kitn[aei]?\s*(hua|hoga|hai|ho\s*gaya)|amount\s*kitn|bill\s*kitn|(cart|bill).{0,12}(total|amount|kitn)|(total|amount).{0,12}(cart|bill|hua))\b/i;

export const CLEAR_CART_HINTS =
  /\b((cart|basket).{0,16}\b(khali|clear|empty|reset|remove\s*all|delete\s*all)\b|\b(khali|clear|empty)\s*(karo|krdo|kr\s*do|kardo|kar\s*do)?\s*(cart|basket)?\b|clear\s*cart|empty\s*cart)\b/i;

export const ADD_TO_CART_HINTS =
  /\b(add(\s*kar(o|do)?)?|daal\s*do|dal\s*do|cart\s*me(in)?\s*add|add\s*(to\s*)?(cart|basket))\b/i;

const ADD_KRDO_CART = /\b(krdo|kardo|kar\s*do)\b/i;

export const MORE_RESULTS_HINTS =
  /\b(aur\s*(dikhao|dikha|results?|options?|products?)|more\s*(results?|options?|products?)?|view\s*all|see\s*all|sab\s*(dikhao|dikha|results?|options?)|poori\s*list|full\s*(list|results?))\b/i;

/** Explicit checkout / proceed — not "oil buy karna" product search. */
const CHECKOUT_STRONG =
  /\b(checkout|check\s*out|aage\s*(badh|bdh|badho|badhne|badhna)|proceed(\s*to\s*(pay|payment|checkout))?|place\s*(my\s*)?order|order\s*place(\s*karo)?|order\s*kar(\s*do)?|payment\s*(karo|kardo|krdo)?|pay\s*(now|karo|kardo)?|bill\s*(bharo|karo)|final\s*(karo|order)|complete\s*order|let'?s\s+buy|lets\s+buy|let\s+us\s+buy|buy\s+now|order\s+now|purchase\s+now|go\s+ahead|kharid\s*(lo|do|lena)|bas\s+(yahi|yeh|itna)|checkout\s*karo)\b/i;

const CHECKOUT_BUY_CONTEXT =
  /\b((yeh|ye|bas\s*yeh|bas\s*yahi|is\s*ko|cart(\s*ka|\s*se)?|sab).{0,28}\b(buy|kharid|order|lena|le\s*lo|lelo|purchase)\b|\b(buy|kharid|order)\s*(karna|karne|lena)\s*hai\b)\b/i;

/** Short buy-only lines with no product name: "buy", "lets buy", "i want to buy". */
const CHECKOUT_BUY_ONLY =
  /^(let'?s|lets|let\s+us)\s+buy\b.*$|^buy(\s+(now|it|please|pls))?[.!]*$|^(i\s+)?(want\s+to\s+)?buy[.!]*$|^(mujhe\s+)?(bas\s+)?(kharidna|kharidne|lena)\s+hai[.!]*$/i;

export const DETAIL_HINTS = /\b(detail|details|kholo|open\s*product|product\s*page)\b/i;

export const GREETING_ONLY =
  /^(hi|hello|hey|namaste|namaskar|hii+|good\s*(morning|evening|afternoon))[\s!.]*$/i;

/**
 * Whole-utterance conversation / small-talk.
 * Must NEVER become catalog search. Allow optional pronouns (aap/tum/you) and politeness.
 */
const CHITCHAT_NORMALIZED =
  /^(how\s+are\s+you(\s+doing)?|how'?s\s+it\s+going|how\s+do\s+you\s+do|what\s+are\s+you\s+doing|what\s+you\s+doing|wyd|kya\s+kar\s+(rahe|rhe)\s+ho|what'?s\s+up|whats\s+up|sup|(aap\s+)?kaise\s+(ho|hain|hai)(\s+(aap|tum|aapse|ji|bhai))?|kaise\s+ho\s+(aap|tum)|kya\s+haal\s*(hai)?(\s+(aap|tum|hai))?|sab\s+theek|all\s+good|who\s+are\s+you|(aap|tum)\s+kaun\s+(ho|hai)|tum\s+kaun\s+ho|what\s+can\s+you\s+do|(aap|tum)\s+kya\s+kar\s+sakte\s+ho|kaise\s+kaam\s+karte\s+ho|help(\s+me)?|madad(\s+chahiye)?|thanks?(?:\s+you)?|thank\s+you|thx|ty|shukriya|dhanyavaad|dhanyavad|bye|goodbye|good\s+night|see\s+you|phir\s+milte\s+hain|ok\s+thanks?)$/i;

/** Expand chat abbreviations + strip trailing punctuation for allowlist match. */
export function normalizeChitchatText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[?!.,]+$/g, "")
    .replace(/\b(howru|howruy|hru|howruu+)\b/g, "how are you")
    .replace(/^(ho|hw)\s+/g, "how ")
    .replace(/\bhw\b/g, "how")
    .replace(/\br\b/g, "are")
    .replace(/\bu{1,}\b/g, "you")
    // Soft politeness particles (don't change intent)
    .replace(/\b(ji|yaar|bro)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * True for greetings + chitchat/help/thanks/bye — conversation-only, never search.
 */
export function isConversationIntent(text: string): boolean {
  const raw = text.trim();
  if (!raw) return false;
  if (GREETING_ONLY.test(raw)) return true;
  return isChitchat(raw);
}

export function isChitchat(text: string): boolean {
  const t = normalizeChitchatText(text);
  if (!t) return false;
  if (CHITCHAT_NORMALIZED.test(t)) return true;
  // Flexible how-are-you family (covers "kaise ho aap", "aap kaise ho", etc.)
  if (
    /^(aap\s+)?kaise\s+(ho|hain|hai)(\s+(aap|tum|aapse|ji|bhai))*$/.test(t)
  ) {
    return true;
  }
  if (/^how\s+are\s+you(\s+doing)?(\s+(today|now))?$/.test(t)) return true;
  // Wellbeing follow-ups: "are you really ok?", "you okay?", "sab theek?"
  if (
    /^are\s+you(\s+\w+){0,3}\s+(ok|okay|fine|alright|well|good)(\s+\w+){0,2}$/.test(
      t,
    )
  ) {
    return true;
  }
  if (/^(you\s+)?(ok|okay|fine|alright)(\s+(though|today|now))?$/.test(t)) {
    return true;
  }
  if (/^sab\s+theek(\s+(hai|ho|na))?$/.test(t)) return true;
  if (/^(aap|tum)\s+kaun\s+(ho|hai)$/.test(t)) return true;
  if (/^(aap|tum)\s+kya\s+kar\s+sakte\s+ho$/.test(t)) return true;
  if (/^kaise\s+kaam\s+karte\s+ho$/.test(t)) return true;
  if (/^phir\s+milte\s+hain$/.test(t)) return true;
  if (/^madad(\s+(chahiye|karo|kar\s*do|krdo))?$/.test(t)) return true;
  return false;
}

/**
 * Clear local shopping signal — required before catalog search.
 * Without this, leftover text must clarify / go to LLM — never search.
 */
export function isShoppingUtterance(
  text: string,
  opts?: {
    keyword?: string | null;
    preferSize?: string | null;
    intentAdd?: boolean;
  },
): boolean {
  const t = text.trim();
  if (!t) return false;
  if (opts?.intentAdd) return true;
  if (opts?.preferSize) return true;
  const kw = (opts?.keyword ?? "").trim();
  if (kw && isGroceryishFromIntent(kw)) return true;
  if (isGroceryishFromIntent(t)) return true;
  // Explicit find/search/chahiye with remaining product-ish words
  if (SEARCH_HINTS.test(t) && stripConversationFillers(t).length >= 2) {
    return true;
  }
  return false;
}

function isGroceryishFromIntent(s: string): boolean {
  return /\b(oil|tel|atta|aata|flour|sugar|chini|dal|rice|chawal|milk|doodh|ghee|salt|namak|tea|chai|honey|shahad|soap|detergent|biscuit|namkeen|masala|spice|powder|wheat|mustard|sarso|sarson|sunflower|coconut|nariyal|toor|arhar|moong|chana|besan|maida|poha|noodles?|pasta|juice|butter|curd|dahi|paneer|eggs?|ande?|bread|pav|ketchup|sauce|pickle|achar|haldi|jeera|mirch|turmeric|cumin|basmati|fortune|patanjali|aashirvaad|tata|dabur|amul|saffola|parle|maggi|nestle|india\s*gate|mother\s*dairy|good\s*life|zandu|sacha|moti)\b/i.test(
    s,
  );
}

function stripConversationFillers(text: string): string {
  return text
    .replace(SEARCH_HINTS, " ")
    .replace(
      /\b(please|pls|mujhe|mujhko|mere|for|the|a|an|some|want|need)\b/gi,
      " ",
    )
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whole-utterance affirm only — "ha fortune oil" must NOT confirm. */
export function isAffirm(text: string): boolean {
  const t = text
    .trim()
    .toLowerCase()
    .replace(/[?!.,]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return false;
  return /^(haan|haa|han|ha|yes|y|ok|okay|theek|thik|confirm|ho\s*jayega|bilkul|sure)(\s+(bilkul|please|pls|ji|haan|haa|yes|ok|okay))?$/.test(
    t,
  );
}

export const DENY =
  /^(nahi|nahe|na|no|cancel|mat|ruk|stop|leave\s+it|rehne\s+do|mat\s+add(\s+karo)?)\b/i;

/**
 * Soft decline of shopping — "koi bhi nahi", "not now", "nothing".
 * Not the same as confirm-gate deny (haan/nahi on a cart item).
 */
export function isShoppingDecline(text: string): boolean {
  const t = text
    .trim()
    .toLowerCase()
    .replace(/[?!.,]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return false;
  if (
    /^(koi\s+bhi\s+nahi+|koi\s+bhi\s+nhi+|kuch\s+nahi+|kuch\s+nhi+|kuch\s+bhi\s+nahi+|nothing|no\s+thanks?|not\s+now|baad\s+mein|baad\s+me|nahi+\s+chahiye|nhi+\s+chahiye|no\s+need|abhi\s+nahi+|abhi\s+nhi+|maybe\s+later|i\s+don'?t\s+need\s+anything(\s+right\s+now)?|don'?t\s+need\s+anything)$/i.test(
      t,
    )
  ) {
    return true;
  }
  // Short "nahi" / "no" only as decline when we just prompted for shopping
  return false;
}

/** Short no that only counts as shopping decline after a shopping prompt. */
export function isSoftNo(text: string): boolean {
  const t = text
    .trim()
    .toLowerCase()
    .replace(/[?!.,]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return /^(nahi+|nhi+|nahe|na|no|nope)$/i.test(t);
}

export const INDEX_WORDS: Record<string, number> = {
  "1": 0,
  "2": 1,
  "3": 2,
  "4": 3,
  "5": 4,
  "6": 5,
  "7": 6,
  "8": 7,
  pehla: 0,
  first: 0,
  dusra: 1,
  doosra: 1,
  second: 1,
  teesra: 2,
  third: 2,
  chautha: 3,
  fourth: 3,
  last: -1, // resolved against optionCount at match time
};

export function wantsAddToCart(text: string): boolean {
  if (ADD_TO_CART_HINTS.test(text)) return true;
  // "sarso tel krdo cart me" — but not "cart khali krdo"
  if (CLEAR_CART_HINTS.test(text)) return false;
  return ADD_KRDO_CART.test(text) && /\b(cart|basket)\b/i.test(text);
}

/**
 * "checkout karo", "lets buy", "aage badhna hai", "yeh buy karna hai" — not "chini buy karna".
 */
export function wantsCheckout(text: string): boolean {
  const t = text.trim();
  if (!t || GREETING_ONLY.test(t)) return false;
  if (CHECKOUT_STRONG.test(t) || CHECKOUT_BUY_ONLY.test(t)) return true;
  if (!CHECKOUT_BUY_CONTEXT.test(t)) return false;

  // Strip checkout/filler words; if a real product name remains → search instead
  const leftover = t
    .replace(CHECKOUT_BUY_CONTEXT, " ")
    .replace(
      /\b(mujhe|mujhko|mujheko|mere|mera|please|pls|hai|hain|ho|karo|kardo|krdo|karna|karne|lena|lelo|chahiye|buy|kharid|purchase|order|cart|basket|yeh|ye|bas|yahi|isko|is|ko|se|ka|ki|ke|sab|ab|abhi|to|too|lets|let'?s|us|want|now)\b/gi,
      " ",
    )
    .replace(/[?!.,']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return leftover.length < 2;
}

export function detectShopIntent(
  text: string,
  context?: ConversationContext,
): ShopIntent {
  const t = text.trim();
  if (!t) return "unknown";
  if (GREETING_ONLY.test(t)) return "greeting";
  if (isConversationIntent(t) || isChitchat(t)) return "chitchat";
  if (wantsCheckout(t)) return "checkout";
  if (wantsAddToCart(t)) return "buy";
  if (CART_TOTAL_HINTS.test(t)) return "cart_total";
  if (CLEAR_CART_HINTS.test(t)) return "clear_cart";
  if (LIST_CART_HINTS.test(t)) return "cart_list";
  if (OPEN_CART_HINTS.test(t)) return "cart_open";
  if (MORE_RESULTS_HINTS.test(t) && context?.lastSearchQuery) {
    return "more_results";
  }
  if (DETAIL_HINTS.test(t)) return "product_detail";
  if (isAffirm(t)) return "affirm";
  if (DENY.test(t)) return "deny";
  // Default to search for anything else
  return "search";
}
