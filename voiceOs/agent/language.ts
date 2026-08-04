import type { ConversationContext, VoiceLanguage } from "../types";

export function detectLanguage(text: string): VoiceLanguage {
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  return "en";
}

export function isHinglish(text: string): boolean {
  return (
    /[\u0900-\u097F]/.test(text) ||
    /\b(mujhe|mujhko|mujheko|chahiye|chaiye|chahye|hai|hain|kitna|kitni|kitn|hua|kya|mera|meri|bolo|karo|dikhao|tel|chini|chawal|sarso|sarson|namaste|cart\s*me|cart\s*mein|abhi|kitn)\b/i.test(
      text,
    )
  );
}

export function preferHi(lang: VoiceLanguage, userText: string): boolean {
  if (isHinglish(userText)) return true;
  if (lang === "hi") return true;
  if (lang === "en") return false;
  return detectLanguage(userText) === "hi";
}

export function languagePatch(
  context: ConversationContext,
  userText: string,
): Partial<ConversationContext> {
  if (isHinglish(userText)) return { language: "hi" };
  return {};
}
