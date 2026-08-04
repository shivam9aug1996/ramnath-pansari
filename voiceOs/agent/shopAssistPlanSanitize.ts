/**
 * Client-side mirror of Next.js shop-assist plan sanitizer (for unit tests + offline validation).
 * Server remains source of truth for production responses.
 */
export type ShopAssistPlanAction =
  | "search"
  | "ask"
  | "pick"
  | "checkout"
  | "cart_list"
  | "none";

export type ShopAssistPlanResult = {
  action: ShopAssistPlanAction;
  keyword?: string | null;
  preferSize?: string | null;
  preferQty?: number | null;
  index?: number | null;
  message?: string | null;
};

const ALLOWED = new Set<ShopAssistPlanAction>([
  "search",
  "ask",
  "pick",
  "checkout",
  "cart_list",
  "none",
]);

const FALLBACK_NONE: ShopAssistPlanResult = {
  action: "none",
  keyword: null,
  preferSize: null,
  preferQty: null,
  index: null,
  message:
    "Samajh nahi aaya. Product ka naam bolo — jaise Fortune mustard oil.",
};

function extractJsonObject(raw: string): unknown | null {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence?.[1]?.trim() ?? trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

function clampQty(n: unknown): number | null {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return null;
  const i = Math.round(v);
  if (i < 1 || i > 5) return null;
  return i;
}

export function sanitizeShopAssistPlan(
  raw: string | undefined | null,
): ShopAssistPlanResult {
  if (!raw?.trim()) return { ...FALLBACK_NONE };

  const parsed = extractJsonObject(raw);
  if (!parsed || typeof parsed !== "object") return { ...FALLBACK_NONE };

  const obj = parsed as Record<string, unknown>;
  const actionRaw = String(obj.action ?? "none").toLowerCase();
  const action = (
    ALLOWED.has(actionRaw as ShopAssistPlanAction) ? actionRaw : "none"
  ) as ShopAssistPlanAction;

  const keyword =
    typeof obj.keyword === "string" && obj.keyword.trim().length >= 2
      ? obj.keyword.trim().slice(0, 80)
      : null;
  const preferSize =
    typeof obj.preferSize === "string" && obj.preferSize.trim()
      ? obj.preferSize.trim().toLowerCase().replace(/\s+/g, "").slice(0, 16)
      : null;
  const preferQty = clampQty(obj.preferQty);
  const indexRaw =
    typeof obj.index === "number" ? obj.index : Number(obj.index);
  const index =
    Number.isFinite(indexRaw) && indexRaw >= 1 && indexRaw <= 20
      ? Math.round(indexRaw)
      : null;
  const message =
    typeof obj.message === "string" && obj.message.trim()
      ? obj.message.trim().slice(0, 280)
      : null;

  if (action === "search" && !keyword) {
    return {
      ...FALLBACK_NONE,
      message: message ?? FALLBACK_NONE.message,
    };
  }
  if (action === "ask" && !message) {
    return { ...FALLBACK_NONE };
  }
  if (action === "pick" && index == null) {
    return { ...FALLBACK_NONE, message: message ?? FALLBACK_NONE.message };
  }

  return {
    action,
    keyword,
    preferSize,
    preferQty,
    index,
    message,
  };
}
