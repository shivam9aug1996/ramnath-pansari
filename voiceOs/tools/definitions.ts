export type ToolParameterSchema = {
  type: "object";
  properties: Record<
    string,
    {
      type: string;
      description: string;
    }
  >;
  required?: string[];
};

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
};

/** LLM-facing tool schemas — business tools only; REST stays in Tool Executor. */
export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "searchProducts",
    description:
      "Search the store catalog by keyword. Use when the user wants to find a product. Never guess — if multiple matches, ask the user which one.",
    parameters: {
      type: "object",
      properties: {
        keyword: {
          type: "string",
          description: "Product search keyword, e.g. fortune mustard oil",
        },
        limit: {
          type: "number",
          description: "Max results to return (default 8)",
        },
      },
      required: ["keyword"],
    },
  },
  {
    name: "addToCart",
    description:
      "Add or set quantity of a product in the cart. Only call after the user confirms product + quantity.",
    parameters: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "Product _id",
        },
        quantity: {
          type: "number",
          description: "Absolute cart quantity for this product (1–max)",
        },
        name: {
          type: "string",
          description: "Product display name",
        },
        image: {
          type: "string",
          description: "Optional product image URL",
        },
      },
      required: ["productId", "quantity"],
    },
  },
  {
    name: "clearCart",
    description:
      "Empty the entire cart. Only call after the user explicitly confirms.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "removeFromCart",
    description:
      "Remove one product from the cart (set quantity to 0). Only after user confirms which cart line.",
    parameters: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "Product _id already in the cart",
        },
        name: {
          type: "string",
          description: "Product display name",
        },
      },
      required: ["productId"],
    },
  },
  {
    name: "getCart",
    description:
      "Return cart contents and/or total. mode=list for items, mode=total for payable amount, mode=summary for short count.",
    parameters: {
      type: "object",
      properties: {
        mode: {
          type: "string",
          description: "list | total | summary",
        },
      },
    },
  },
  {
    name: "startCheckout",
    description:
      "Start checkout: sync cart (stock/price/holds/store hours), then hand off to address + payment UI. Use when user wants to proceed/buy/checkout/place order — not for searching a product.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "openUi",
    description:
      "Request a native UI handoff (map, cart, product detail, search results, payment, login).",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description:
            "OPEN_SEARCH_RESULTS | OPEN_PRODUCT_DETAIL | OPEN_CART | OPEN_MAP_PICKER | OPEN_PAYMENT | OPEN_LOGIN",
        },
        query: {
          type: "string",
          description: "Search query when opening search results",
        },
        productId: {
          type: "string",
          description: "Product id when opening product detail",
        },
      },
      required: ["action"],
    },
  },
];

export function getToolDefinition(name: string): ToolDefinition | undefined {
  return TOOL_DEFINITIONS.find((t) => t.name === name);
}
