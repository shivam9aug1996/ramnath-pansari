import { getTimeOfDay } from "@/utils/huggingface";
import { OrderStatus } from "@/constants/Order";
import type { ActiveFloatOrder } from "@/utils/activeOrderFloat";

export function getFirstName(name?: string | null): string {
  const first = name?.trim().split(/\s+/).filter(Boolean)[0];
  return first || "there";
}

export function hinglishSalutation(timeOfDay = getTimeOfDay()): string {
  switch (timeOfDay) {
    case "morning":
      return "Shubh morning";
    case "afternoon":
      return "Shubh afternoon";
    case "evening":
      return "Shubh evening";
    case "night":
      return "Shubh night";
    default:
      return "Namaste";
  }
}

function cleanLocality(locality?: string | null): string | null {
  const value = locality?.trim().replace(/\s+/g, " ");
  if (!value) return null;
  // Keep banners short — use first segment before comma.
  const short = value.split(",")[0]?.trim() || value;
  return short.length > 28 ? `${short.slice(0, 27).trimEnd()}…` : short;
}

function weatherPhrase(
  weatherDescription?: string | null,
  weatherMain?: string | null,
): string | null {
  const description = weatherDescription?.trim().toLowerCase();
  if (description) return description;
  const main = weatherMain?.trim().toLowerCase();
  return main || null;
}

/**
 * Client-side homepage banner — no LLM.
 * e.g. "Shubh morning, Shivam — light rain in Civil Lines, chai-nashta ready in 30? 🛒"
 */
export function buildPersonalizedHomeBanner({
  name,
  locality,
  weatherDescription,
  weatherMain,
}: {
  name?: string | null;
  locality?: string | null;
  weatherDescription?: string | null;
  weatherMain?: string | null;
}): string {
  const first = getFirstName(name);
  const salutation = hinglishSalutation();
  const place = cleanLocality(locality);
  const weather = weatherPhrase(weatherDescription, weatherMain);

  if (weather && place) {
    return `${salutation}, ${first} — ${weather} in ${place}, chai-nashta ready in 30? 🛒`;
  }
  if (weather) {
    return `${salutation}, ${first} — ${weather}, chai-nashta ready in 30? 🛒`;
  }
  if (place) {
    return `${salutation}, ${first} — groceries to ${place} in 30 mins! 🛒`;
  }
  return `${salutation}, ${first}! Staples & pulses delivered in 30 mins 🛒`;
}

/** Uses the same active-delivery data as ActiveDeliveryFloat — no LLM. */
export function buildActiveOrderBanner({
  name,
  orders,
}: {
  name?: string | null;
  orders: ActiveFloatOrder[];
}): string | null {
  if (!orders?.length) return null;

  const first = getFirstName(name);
  const delivering = orders.filter(
    (order) =>
      order.orderStatus?.toLowerCase() === OrderStatus.OUT_FOR_DELIVERY,
  ).length;

  if (orders.length === 1) {
    if (delivering > 0) {
      return `${first}, your order is out for delivery — track it anytime! 🚚`;
    }
    return `${first}, your order is confirmed — we're packing it now! 🛒`;
  }

  if (delivering > 0) {
    return `${first}, ${orders.length} active orders — ${delivering} on the way! 🚚`;
  }

  return `${first}, ${orders.length} orders confirmed — hang tight! 🛒`;
}

function shortProductLabel(name: string, max = 22): string {
  const cleaned = name.trim().replace(/\s+/g, " ");
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

function uniqueProductNames(orders: ActiveFloatOrder[], max = 3): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const order of orders) {
    for (const raw of order.productNames ?? []) {
      const name = raw?.trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      result.push(shortProductLabel(name));
      if (result.length >= max) return result;
    }
  }

  return result;
}

function formatItemList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} & ${items[1]}`;
  return `${items[0]}, ${items[1]} & more`;
}

/**
 * 5th carousel slide — names what’s in the active order (template, no LLM).
 * e.g. "Shivam, your Atta & Oil are on the way! 🚚"
 */
export function buildActiveOrderItemsBanner({
  name,
  orders,
}: {
  name?: string | null;
  orders: ActiveFloatOrder[];
}): string | null {
  if (!orders?.length) return null;

  const items = uniqueProductNames(orders, 3);
  if (!items.length) return null;

  const first = getFirstName(name);
  const itemList = formatItemList(items);
  const delivering = orders.some(
    (order) =>
      order.orderStatus?.toLowerCase() === OrderStatus.OUT_FOR_DELIVERY,
  );

  if (delivering) {
    return `${first}, your ${itemList} ${items.length === 1 ? "is" : "are"} on the way! 🚚`;
  }

  return `${first}, packing your ${itemList} now — almost ready! 🛒`;
}

export function buildTypewriterLines({
  name,
  locality,
  hasActiveDelivery,
}: {
  name?: string | null;
  locality?: string | null;
  hasActiveDelivery?: boolean;
}): { greeting: string; subtitle: string } {
  const first = getFirstName(name);
  const greeting = `${hinglishSalutation()}, ${first}`;
  if (hasActiveDelivery) {
    return { greeting, subtitle: "Order on the way!" };
  }
  const place = cleanLocality(locality);
  const subtitle = place ? `In ${place}` : "Ready to shop?";
  return { greeting, subtitle };
}
