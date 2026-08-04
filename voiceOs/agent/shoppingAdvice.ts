/**
 * Shopping advice replies — recommend first, search second.
 */
import type { ConversationContext } from "../types";
import { preferHi } from "./language";

export type AdviceTopic =
  | "oil"
  | "atta"
  | "rice"
  | "ghee"
  | "tea"
  | "biscuit"
  | "shampoo"
  | "detergent"
  | "toothpaste"
  | "general";

export function extractAdviceTopic(text: string): AdviceTopic {
  const t = text.toLowerCase();
  if (/\b(oil|tel)\b/i.test(t)) return "oil";
  if (/\b(atta|aata|flour)\b/i.test(t)) return "atta";
  if (/\b(rice|chawal|basmati)\b/i.test(t)) return "rice";
  if (/\b(ghee)\b/i.test(t)) return "ghee";
  if (/\b(tea|chai)\b/i.test(t)) return "tea";
  if (/\b(biscuit|biscuits|namkeen)\b/i.test(t)) return "biscuit";
  if (/\b(shampoo)\b/i.test(t)) return "shampoo";
  if (/\b(detergent)\b/i.test(t)) return "detergent";
  if (/\b(toothpaste)\b/i.test(t)) return "toothpaste";
  return "general";
}

/** Advice body + soft CTA to search — never emits tools. */
export function buildShoppingAdviceMessage(
  text: string,
  context: ConversationContext,
): string {
  const hi = preferHi(context.language, text);
  const name = context.customerName ? `, ${context.customerName}` : "";
  const topic = extractAdviceTopic(text);

  if (topic === "oil") {
    return hi
      ? `Aap kis purpose ke liye oil lena chahte hain${name}?\n• Daily cooking — Fortune, Saffola, Dhara\n• Heart-friendly — rice bran / Saffola Active\n• Tadka / Indian taste — mustard (sarso) oil\n• Deep frying — refined sunflower / rice bran\nType ya brand bolo — jaise "mustard oil" ya "Fortune oil" — main products dikha dunga.`
      : `What will you use the oil for${name}?\n• Daily cooking — Fortune, Saffola, Dhara\n• Heart-friendly — rice bran / Saffola Active\n• Tadka — mustard oil\n• Deep frying — refined sunflower / rice bran\nTell me a type or brand — e.g. "mustard oil" or "Fortune oil" — and I'll show products.`;
  }
  if (topic === "atta") {
    return hi
      ? `Atta ke liye Aashirvaad, Fortune aur Pillsbury popular hain${name}. Chakki fresh / whole wheat daily roti ke liye achha rehta hai.\nBrand ya size bolo — jaise "Aashirvaad atta 5 kg" — main dikha dunga.`
      : `For atta, Aashirvaad, Fortune, and Pillsbury are popular${name}. Chakki / whole wheat works well for daily rotis.\nName a brand or size — e.g. "Aashirvaad atta 5 kg" — and I'll show options.`;
  }
  if (topic === "rice") {
    return hi
      ? `Rice mein India Gate, Fortune aur Daawat basmati common choices hain${name}. Daily ke liye sona masoori / kolam bhi theek hai.\nKaunsa type chahiye? Naam bolo — main search kar dunga.`
      : `For rice, India Gate, Fortune, and Daawat basmati are common${name}. For daily use, sona masoori / kolam also work.\nWhich type? Name it and I'll search.`;
  }
  if (topic === "ghee") {
    return hi
      ? `Ghee ke liye Amul, Mother Dairy aur desi / pure ghee brands popular hain${name}.\nBrand bolo — main products dikha dunga.`
      : `For ghee, Amul, Mother Dairy, and pure/desi brands are popular${name}.\nName a brand and I'll show products.`;
  }
  if (topic === "tea") {
    return hi
      ? `Tea ke liye Tata, Red Label, Wagh Bakri achhe options hain${name}.\nBrand bolo to main dikha dunga.`
      : `For tea, Tata, Red Label, and Wagh Bakri are solid options${name}.\nName a brand and I'll show products.`;
  }
  if (topic === "biscuit") {
    return hi
      ? `Biscuits mein Parle-G, Good Day, Hide & Seek popular hain${name}.\nNaam bolo — main search karunga.`
      : `Popular biscuits include Parle-G, Good Day, and Hide & Seek${name}.\nName one and I'll search.`;
  }
  if (topic === "shampoo" || topic === "detergent" || topic === "toothpaste") {
    const label =
      topic === "shampoo"
        ? "Shampoo"
        : topic === "detergent"
          ? "Detergent"
          : "Toothpaste";
    return hi
      ? `${label} ke liye common brands hain${name} — bolo kaunsa brand / type chahiye, main products dikha dunga.`
      : `For ${label.toLowerCase()}, tell me a brand or type${name} and I'll show products.`;
  }

  // Compare / generic
  if (/\b(vs\.?|versus|difference|better\s+than|compare)\b/i.test(text)) {
    return hi
      ? `Dono brands ke products alag sizes/prices mein milte hain${name}. Jo brand try karna hai uska naam + product bolo — jaise "Fortune oil" — main compare karne layak options dikha dunga.`
      : `Both brands have different sizes and prices${name}. Name the brand + product you want to see — e.g. "Fortune oil" — and I'll show options you can compare.`;
  }

  return hi
    ? `Main suggest kar sakta hoon${name}, lekin pehle thoda clear bolo — kaunsa product / brand dekhna hai?\nJaise "Fortune oil", "Aashirvaad atta", ya "mustard oil".`
    : `I can suggest options${name} — tell me which product or brand to look at.\nE.g. "Fortune oil", "Aashirvaad atta", or "mustard oil".`;
}
