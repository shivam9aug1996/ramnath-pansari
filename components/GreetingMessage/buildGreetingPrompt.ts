/** Client only sends structured greeting requests — prompts are built on the server. */

export type GreetingType = "weather" | "cart" | "batch";

export type WeatherGreetingPayload = {
  weatherDescription: string;
  weatherMain: string;
  timeOfDay: string;
};

export type CartGreetingPayload = {
  cartItems: string[];
  recentlyViewedItems: string[];
  orderedItems?: string[];
  timeOfDay: string;
};

export type BatchGreetingPayload = {
  timeOfDay: string;
  weatherDescription?: string;
  weatherMain?: string;
  cartItems?: string[];
  recentlyViewedItems?: string[];
  orderedItems?: string[];
  activeOrderStatus?: string;
  activeOrderedItems?: string[];
};

export type StructuredGreetingBody =
  | { type: "weather"; payload: WeatherGreetingPayload }
  | { type: "cart"; payload: CartGreetingPayload }
  | { type: "batch"; payload: BatchGreetingPayload };

export function hashGreetingRequest(body: StructuredGreetingBody): string {
  return JSON.stringify(body);
}

export function activeOrdersFingerprint(
  orders: Array<{ _id?: string; orderStatus?: string }> | null | undefined,
): string {
  if (!orders?.length) return "none";
  return orders
    .map((order) => `${order._id ?? ""}:${order.orderStatus?.toLowerCase() ?? ""}`)
    .sort()
    .join("|");
}
