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
    const greeting = timeOfDay ? `Good ${timeOfDay}!` : `Hi!`;
  
    const hasCart = cartItems.length > 0;
    const hasViewed = recentlyViewedItems.length > 0;
  
    const activityDescription = hasCart && hasViewed
      ? `The user recently added items to their cart and also viewed other products.`
      : hasCart
        ? `The user recently added items to their cart.`
        : hasViewed
          ? `The user hasn’t added anything to their cart, but recently viewed some products.`
          : `The user hasn’t interacted with products yet.`;
  
    const cartList = hasCart ? cartItems.map(item => `- ${item}`).join("\n") : "None";
    const viewedList = hasViewed ? recentlyViewedItems.map(item => `- ${item}`).join("\n") : "None";
  
    return `
  ${greeting}
  
  🛍️ Context:
  - Time of day: ${timeOfDay || "Not specified"}
  - ${activityDescription}
  
  Cart items:
  ${cartList}
  Recently viewed:
  ${viewedList}
  
  📝 Instructions:
  Generate **exactly one** short message (1–2 lines, max 25 words) for a mobile shopping app homepage. This is **not** a chatbot or a conversation. The user will not reply.
  
  The message should:
  - Be casual, friendly, and helpful
  - NOT ask questions or suggest a reply
  - Include **at most one emoji**
  - Fit naturally in a shopping app homepage
  - End with something like:
    - “Enjoy exploring!”
    - “Happy shopping!”
    - “Hope you find your favorites!”
  
  Tone: positive, warm, and slightly varied (cozy, festive, efficient, health-conscious — depending on context). If no activity, just welcome the user in a cheerful, neutral way.
  
  🚫 Do not:
  - Return multiple messages
  - Include instructions or bullets
  - Ask questions
  
  ✅ Output: Just the final message in plain text.
    `.trim();
  };
  