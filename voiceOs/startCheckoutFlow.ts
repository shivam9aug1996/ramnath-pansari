import AsyncStorage from "@react-native-async-storage/async-storage";
import store from "@/redux/store";
import { cartApi, setCartPayableTotals } from "@/redux/features/cartSlice";
import { offerApi } from "@/redux/features/offerSlice";
import { deliverySettingsApi } from "@/redux/features/deliverySettingsSlice";
import { storeConfigApi } from "@/redux/features/storeConfigSlice";
import { setCheckoutFlow } from "@/redux/features/orderSlice";
import { mergeCartItemsWithOffers } from "@/utils/applyOptimisticOffers";
import { applyPostCheckoutCartUpdate } from "@/utils/applyPostCheckoutCartUpdate";
import { removeHeldProductsFromCart } from "@/utils/removeHeldProductsFromCart";
import { persistPromoConfigCache } from "@/utils/promoConfigCache";
import { persistStoreConfigCache } from "@/utils/storeConfigCache";
import {
  resolveDeliverySettings,
  type DeliverySettings,
} from "@/utils/deliveryFee";
import { resolveStoreConfig, type StoreConfig } from "@/utils/storeConfig";
import { mapCartItemsFromApi } from "./cartMapping";
import {
  runCheckoutFlow,
  type CheckoutFlowResult,
} from "@/utils/runCheckoutFlow";
import { getCartPriceBreakdown } from "@/utils/cartPriceBreakdown";
import type { RootState } from "@/types/global";

export type StartCheckoutOutcome =
  | {
      status: "proceed";
      payableTotal: number;
      orderDiscount: number;
      message: string;
    }
  | {
      status: "abort";
      reason: string;
      message: string;
      toastType: "info" | "error";
      cartUpdated?: boolean;
      cartItemCount?: number;
      cartItems?: Array<{
        productId: string;
        name?: string;
        quantity: number;
        unitPrice?: number | null;
        lineTotal?: number | null;
      }>;
    }
  | {
      status: "blocked";
      reason: "login" | "empty_cart";
      message: string;
    };

/**
 * Same gates as cart Continue button — sync, stock, price drift, store hours.
 * On proceed: sets checkoutFlow + payable total (Pay sheet can show).
 */
export async function startCheckoutFlow(params: {
  dispatch: typeof store.dispatch;
  getState: typeof store.getState;
  userId: string | null;
}): Promise<StartCheckoutOutcome> {
  const { dispatch, getState, userId } = params;

  if (!userId) {
    return {
      status: "blocked",
      reason: "login",
      message: "Checkout ke liye login zaroori hai.",
    };
  }

  const state = getState() as RootState;
  const cartQuery = cartApi.endpoints.fetchCart.select({ userId })(state);
  let cartData = cartQuery?.data as
    | { cart?: { items?: any[] }; orderDiscount?: number }
    | undefined;

  // Fresh cart if cache missing / stale
  try {
    cartData = await dispatch(
      cartApi.endpoints.fetchCart.initiate({ userId }, { forceRefetch: true }),
    ).unwrap();
  } catch {
    // fall through with cache
  }

  const itemCount = cartData?.cart?.items?.length ?? 0;
  if (itemCount === 0) {
    return {
      status: "blocked",
      reason: "empty_cart",
      message: "Cart khali hai — pehle kuch add karo.",
    };
  }

  const cachedOffers =
    offerApi.endpoints.fetchOffers.select()(state)?.data?.offers ?? [];
  const deliverySettings: DeliverySettings = resolveDeliverySettings(
    deliverySettingsApi.endpoints.fetchDeliverySettings.select()(state)?.data
      ?.deliverySettings,
  );
  const storeConfig: StoreConfig = resolveStoreConfig(
    storeConfigApi.endpoints.fetchStoreConfig.select()(state)?.data
      ?.storeConfig,
  );

  const merged = mergeCartItemsWithOffers(
    cartData?.cart?.items ?? [],
    cachedOffers,
  );
  const { orderDiscount } = getCartPriceBreakdown(
    merged,
    cachedOffers,
    cartData?.orderDiscount ?? 0,
  );

  dispatch(setCheckoutFlow(true));

  try {
    const result: CheckoutFlowResult = await runCheckoutFlow({
      userId,
      cartData,
      cachedOffers,
      deliverySettings,
      storeConfig,
      orderDiscount,
      fetchOffers: async () =>
        dispatch(
          offerApi.endpoints.fetchOffers.initiate(undefined, {
            forceRefetch: true,
          }),
        ).unwrap(),
      fetchDeliverySettings: async () =>
        dispatch(
          deliverySettingsApi.endpoints.fetchDeliverySettings.initiate(
            undefined,
            { forceRefetch: true },
          ),
        ).unwrap(),
      fetchStoreConfig: async () =>
        dispatch(
          storeConfigApi.endpoints.fetchStoreConfig.initiate(undefined, {
            forceRefetch: true,
          }),
        ).unwrap(),
      onPromoConfigPersisted: (offers, delivery) => {
        persistPromoConfigCache(offers, delivery).catch(() => {});
      },
      onStoreConfigPersisted: (config) => {
        persistStoreConfigCache(config).catch(() => {});
      },
      updateProductsAsPerCart: async ({ items }) =>
        dispatch(
          cartApi.endpoints.updateProductsAsPerCart.initiate({
            body: { items },
            params: { userId },
          }),
        ).unwrap(),
      bulkUpdateCart: async ({ items }) =>
        dispatch(
          cartApi.endpoints.bulkUpdateCart.initiate({
            body: { items },
            params: { userId },
          }),
        ).unwrap(),
      fetchCart: async () =>
        dispatch(
          cartApi.endpoints.fetchCart.initiate({ userId }, { forceRefetch: true }),
        ).unwrap(),
      applyPostCheckoutCartUpdate: async (newCartData, synced) =>
        applyPostCheckoutCartUpdate(dispatch, userId, newCartData, synced),
      removeHeldProductsFromCart: async ({
        heldProductIds,
        currentCartItems,
      }) =>
        removeHeldProductsFromCart({
          dispatch,
          userId,
          heldProductIds,
          currentCartItems,
          bulkUpdateCart: (args) =>
            dispatch(cartApi.endpoints.bulkUpdateCart.initiate(args)) as {
              unwrap: () => Promise<{ failedItems?: unknown[] }>;
            },
          fetchCartData: (args, preferCache) =>
            dispatch(
              cartApi.endpoints.fetchCart.initiate(args, {
                forceRefetch: !preferCache,
              }),
            ) as {
              unwrap: () => Promise<{ cart?: { items?: unknown[] } }>;
            },
        }),
      markCartSynced: async () => {
        await AsyncStorage.setItem(`cartData-${userId}-needToSync`, "false");
      },
      releaseCheckoutHolds: async (productIds) => {
        if (!productIds.length) return;
        await dispatch(
          cartApi.endpoints.releaseCheckoutHolds.initiate({
            params: { userId },
            body: { productIds },
          }),
        ).unwrap();
      },
      mergeCartItemsWithOffers,
    });

    if (result.status === "proceed") {
      dispatch(setCartPayableTotals({ total: result.payableTotal }));
      return {
        status: "proceed",
        payableTotal: result.payableTotal,
        orderDiscount: result.orderDiscount,
        message: `Checkout ready — payable ≈ ₹${result.payableTotal}. Address choose karke pay karo.`,
      };
    }

    dispatch(setCheckoutFlow(false));
    const refreshed = cartApi.endpoints.fetchCart.select({ userId })(
      getState() as RootState,
    )?.data;
    const cartItems = mapCartItemsFromApi(refreshed ?? cartData);
    return {
      status: "abort",
      reason: result.reason,
      message: result.message,
      toastType: result.toastType,
      cartUpdated: result.cartUpdated,
      cartItemCount: cartItems.length,
      cartItems,
    };
  } catch {
    dispatch(setCheckoutFlow(false));
    return {
      status: "abort",
      reason: "unexpected_error",
      message: "Checkout continue nahi ho paya. Thodi der baad try karo.",
      toastType: "error",
    };
  }
}
