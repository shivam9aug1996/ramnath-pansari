interface PromptParams {
  cartItems: string[];
  recentlyViewedItems: string[];
  timeOfDay?: string;
}

export const buildGreetingPrompt = ({
  cartItems,
  recentlyViewedItems,
  timeOfDay,
}: PromptParams): string => {
  const hasCart = cartItems.length > 0;
  const hasViewed = recentlyViewedItems.length > 0;

  const activityDescription = hasCart && hasViewed
    ? "The user recently added items to their cart and viewed other products."
    : hasCart
      ? "The user recently added items to their cart."
      : hasViewed
        ? "The user recently viewed products but has an empty cart."
        : "The user has not browsed products yet.";

  const cartList = hasCart ? cartItems.join(", ") : "none";
  const viewedList = hasViewed ? recentlyViewedItems.join(", ") : "none";

  return [
    `Time of day: ${timeOfDay || "unknown"}.`,
    activityDescription,
    `Cart items: ${cartList}.`,
    `Recently viewed: ${viewedList}.`,
    "Write one friendly homepage banner that nudges them to keep shopping.",
  ].join(" ");
};

export const buildWeatherGreetingPrompt = ({
  weatherDescription,
  weatherMain,
  timeOfDay,
}: {
  weatherDescription: string;
  weatherMain: string;
  timeOfDay: string;
}) => {
  return [
    `Time of day: ${timeOfDay}.`,
    `Weather: ${weatherDescription} (${weatherMain}).`,
    "Write one warm Hinglish homepage banner that mentions the weather naturally and encourages browsing groceries.",
  ].join(" ");
};
