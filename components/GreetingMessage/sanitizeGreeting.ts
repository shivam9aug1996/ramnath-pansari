const META_LINE =
  /^\s*(\(Note:|Note:|Instructions:|If you'd prefer|Output:|📝|🚫|✅|Here'?s your)/i;

const PROMPT_LIKE =
  /(Instructions:|Output:|Generate \*\*exactly|Do not:|🛍️ Context|Cart items:|Recently viewed:)/i;

export function sanitizeGreeting(
  raw: string | undefined | null,
  fallback: string,
): string {
  if (!raw?.trim()) {
    return fallback;
  }

  let text = raw.trim().replace(/^["']|["']$/g, "");

  const noteIndex = text.search(/\s*\(Note:/i);
  if (noteIndex > 0) {
    text = text.slice(0, noteIndex);
  }

  text = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !META_LINE.test(line))
    .join(" ")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s\s+/g, " ")
    .trim();

  if (!text || PROMPT_LIKE.test(text) || text.length < 8) {
    return fallback;
  }

  if (text.length > 120) {
    return `${text.slice(0, 117).trim()}…`;
  }

  return text;
}
