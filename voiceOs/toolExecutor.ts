import store from "@/redux/store";
import { searchApi } from "@/redux/features/searchSlice";
import { cartApi } from "@/redux/features/cartSlice";
import type { Product } from "@/types/global";
import { getPayableTotalFromItems } from "@/utils/deliveryFee";
import type {
  CartContextItem,
  ConversationContext,
  SessionProduct,
  ToolResult,
  UiAction,
} from "../types";
import { mapCartItemsFromApi } from "./cartMapping";
import {
  rankSearchProducts,
  rewriteSearchKeyword,
} from "./searchQuality";
import { startCheckoutFlow } from "./startCheckoutFlow";

export type ToolExecutorContext = {
  dispatch: typeof store.dispatch;
  getState: typeof store.getState;
  session: ConversationContext;
};

function toSessionProduct(p: Product): SessionProduct {
  return {
    _id: p._id,
    name: p.name,
    size: p.size ?? null,
    price: p.price ?? null,
    discountedPrice: p.discountedPrice ?? null,
    isOutOfStock: p.isOutOfStock,
    maxQuantity: p.maxQuantity ?? null,
    image: p.image ?? null,
  };
}

function mapCartItems(cartData: any): CartContextItem[] {
  return mapCartItemsFromApi(cartData);
}

function cartTotals(cartData: any, items: CartContextItem[]) {
  const rawItems = cartData?.cart?.items ?? [];
  let payableTotal: number | null = null;
  try {
    payableTotal = getPayableTotalFromItems(rawItems as any);
  } catch {
    payableTotal = items.reduce((sum, i) => sum + (i.lineTotal ?? 0), 0);
  }
  const subtotal = items.reduce((sum, i) => sum + (i.lineTotal ?? 0), 0);
  return {
    subtotal: Number(subtotal.toFixed(2)),
    payableTotal:
      payableTotal != null ? Number(Number(payableTotal).toFixed(2)) : subtotal,
  };
}

async function searchProducts(
  args: Record<string, unknown>,
  ctx: ToolExecutorContext,
): Promise<ToolResult> {
  const rawKeyword = String(args.keyword ?? "").trim();
  const keyword = rewriteSearchKeyword(rawKeyword);
  if (!keyword) {
    return {
      ok: false,
      toolName: "searchProducts",
      error: "keyword is required",
    };
  }

  const preferSize =
    typeof args.preferSize === "string" && args.preferSize.trim()
      ? args.preferSize.trim()
      : null;
  const baseLimit = Math.min(Number(args.limit) || 8, 20);
  const limit = preferSize ? Math.min(Math.max(baseLimit, 12), 20) : baseLimit;

  try {
    const data = await ctx
      .dispatch(
        searchApi.endpoints.fetchProductsBySearchQueryData.initiate(
          {
            query: keyword,
            type: "autocomplete",
            page: 1,
            limit,
          },
          { forceRefetch: true },
        ),
      )
      .unwrap();

    const results = rankSearchProducts(
      ((data?.results ?? []) as Product[]).map(toSessionProduct),
      keyword,
      { preferSize },
    );
    const totalResults = Number(
      (data as { totalResults?: number })?.totalResults ?? results.length,
    );

    return {
      ok: true,
      toolName: "searchProducts",
      data: {
        keyword: rawKeyword || keyword,
        resolvedKeyword: keyword,
        count: results.length,
        totalResults,
        hasMore: totalResults > results.length,
        products: results,
      },
    };
  } catch (err: unknown) {
    const message =
      err && typeof err === "object" && "error" in err
        ? String((err as { error?: string }).error)
        : err instanceof Error
          ? err.message
          : "Search failed";
    return {
      ok: false,
      toolName: "searchProducts",
      error: message,
    };
  }
}

async function addToCart(
  args: Record<string, unknown>,
  ctx: ToolExecutorContext,
): Promise<ToolResult> {
  const productId = String(args.productId ?? "").trim();
  const quantity = Number(args.quantity);
  const name = args.name ? String(args.name) : undefined;
  const image = args.image ? String(args.image) : undefined;
  const userId = ctx.session.customerId;

  if (!productId) {
    return { ok: false, toolName: "addToCart", error: "productId is required" };
  }
  if (!userId) {
    return {
      ok: false,
      toolName: "addToCart",
      error: "Please login to add items to cart",
    };
  }
  if (!Number.isFinite(quantity) || quantity < 0) {
    return { ok: false, toolName: "addToCart", error: "Invalid quantity" };
  }

  try {
    await ctx
      .dispatch(
        cartApi.endpoints.updateCart.initiate({
          body: {
            quantity,
            productId,
            productDetails: {
              name: name ?? "Product",
              image: image ?? null,
            },
          },
          params: { userId },
        }),
      )
      .unwrap();

    const cartData = await ctx
      .dispatch(
        cartApi.endpoints.fetchCart.initiate({ userId }, { forceRefetch: true }),
      )
      .unwrap();

    const items = mapCartItems(cartData);
    const line = items.find((i) => i.productId === productId);

    return {
      ok: true,
      toolName: "addToCart",
      data: {
        productId,
        quantity,
        name,
        cartItemCount: items.length,
        cartItems: items,
        lineQuantity: line?.quantity ?? quantity,
      },
    };
  } catch (err: unknown) {
    const message =
      err && typeof err === "object" && "data" in err
        ? JSON.stringify((err as { data?: unknown }).data)
        : err instanceof Error
          ? err.message
          : "Failed to update cart";
    return { ok: false, toolName: "addToCart", error: message };
  }
}

async function removeFromCart(
  args: Record<string, unknown>,
  ctx: ToolExecutorContext,
): Promise<ToolResult> {
  const productId = String(args.productId ?? "").trim();
  const name = args.name ? String(args.name) : undefined;
  const userId = ctx.session.customerId;

  if (!productId) {
    return {
      ok: false,
      toolName: "removeFromCart",
      error: "productId is required",
    };
  }
  if (!userId) {
    return {
      ok: false,
      toolName: "removeFromCart",
      error: "Please login to update cart",
    };
  }

  try {
    await ctx
      .dispatch(
        cartApi.endpoints.updateCart.initiate({
          body: {
            quantity: 0,
            productId,
            productDetails: {
              name: name ?? "Product",
              image: null,
            },
          },
          params: { userId },
        }),
      )
      .unwrap();

    const cartData = await ctx
      .dispatch(
        cartApi.endpoints.fetchCart.initiate({ userId }, { forceRefetch: true }),
      )
      .unwrap();

    const items = mapCartItems(cartData);

    return {
      ok: true,
      toolName: "removeFromCart",
      data: {
        productId,
        name,
        cartItemCount: items.length,
        cartItems: items,
      },
    };
  } catch (err: unknown) {
    const message =
      err && typeof err === "object" && "data" in err
        ? JSON.stringify((err as { data?: unknown }).data)
        : err instanceof Error
          ? err.message
          : "Failed to remove from cart";
    return { ok: false, toolName: "removeFromCart", error: message };
  }
}

async function clearCart(
  _args: Record<string, unknown>,
  ctx: ToolExecutorContext,
): Promise<ToolResult> {
  const userId = ctx.session.customerId;
  if (!userId) {
    return {
      ok: false,
      toolName: "clearCart",
      error: "Please login to clear cart",
    };
  }

  try {
    await ctx
      .dispatch(
        cartApi.endpoints.clearCart.initiate({
          body: {},
          params: { userId },
        }),
      )
      .unwrap();

    await ctx
      .dispatch(
        cartApi.endpoints.fetchCart.initiate({ userId }, { forceRefetch: true }),
      )
      .unwrap();

    return {
      ok: true,
      toolName: "clearCart",
      data: { cartItemCount: 0, cartItems: [] },
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to clear cart";
    return { ok: false, toolName: "clearCart", error: message };
  }
}

async function getCart(
  args: Record<string, unknown>,
  ctx: ToolExecutorContext,
): Promise<ToolResult> {
  const mode = String(args.mode ?? "list");
  const userId = ctx.session.customerId;
  if (!userId) {
    return {
      ok: true,
      toolName: "getCart",
      data: {
        mode,
        itemCount: ctx.session.cartItemCount,
        items: ctx.session.cartItems,
        subtotal: null,
        payableTotal: null,
      },
    };
  }

  try {
    const cartData = await ctx
      .dispatch(
        cartApi.endpoints.fetchCart.initiate({ userId }, { forceRefetch: true }),
      )
      .unwrap();
    const items = mapCartItems(cartData);
    const totals = cartTotals(cartData, items);
    return {
      ok: true,
      toolName: "getCart",
      data: {
        mode,
        itemCount: items.length,
        items,
        ...totals,
      },
    };
  } catch {
    return {
      ok: true,
      toolName: "getCart",
      data: {
        mode,
        itemCount: ctx.session.cartItemCount,
        items: ctx.session.cartItems,
        subtotal: null,
        payableTotal: null,
      },
    };
  }
}

function openUi(args: Record<string, unknown>): ToolResult {
  const action = String(args.action ?? "") as UiAction["action"];
  const allowed: UiAction["action"][] = [
    "OPEN_SEARCH_RESULTS",
    "OPEN_PRODUCT_DETAIL",
    "OPEN_CART",
    "OPEN_MAP_PICKER",
    "OPEN_PAYMENT",
    "OPEN_LOGIN",
  ];

  if (!allowed.includes(action)) {
    return {
      ok: false,
      toolName: "openUi",
      error: `Unknown UI action: ${action}`,
    };
  }

  const uiAction = {
    action,
    query: args.query ? String(args.query) : undefined,
    productId: args.productId ? String(args.productId) : undefined,
  } as UiAction;

  return {
    ok: true,
    toolName: "openUi",
    data: { uiAction },
  };
}

async function startCheckout(
  _args: Record<string, unknown>,
  ctx: ToolExecutorContext,
): Promise<ToolResult> {
  try {
    const outcome = await startCheckoutFlow({
      dispatch: ctx.dispatch,
      getState: ctx.getState,
      userId: ctx.session.customerId,
    });
    return {
      ok: true,
      toolName: "startCheckout",
      data: outcome,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      toolName: "startCheckout",
      error:
        err instanceof Error
          ? err.message
          : "Checkout could not continue",
    };
  }
}

const handlers: Record<
  string,
  (
    args: Record<string, unknown>,
    ctx: ToolExecutorContext,
  ) => Promise<ToolResult> | ToolResult
> = {
  searchProducts,
  addToCart,
  removeFromCart,
  clearCart,
  getCart,
  openUi,
  startCheckout,
};

/**
 * Converts LLM tool calls into real RTK / navigation side-effects.
 * The model never sees REST paths — only tool names + args.
 */
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolExecutorContext,
): Promise<ToolResult> {
  const handler = handlers[name];
  if (!handler) {
    return {
      ok: false,
      toolName: name,
      error: `Unknown tool: ${name}`,
    };
  }
  return handler(args, ctx);
}
