import {
  findCartChanges,
  findMaxQuantityChanges,
} from "@/components/cart/utils";
import {
  getPayableTotalFromItems,
  hasDeliverySettingsChanged,
  resolveDeliverySettings,
  type DeliverySettings,
} from "@/utils/deliveryFee";
import {
  findPromoOfferChanges,
  getPaidCartItems,
  getPaidCartPayload,
} from "@/utils/cartOfferUtils";
import {
  getStoreClosedMessage,
  canAcceptOrders,
  hasStoreConfigChanged,
  resolveStoreConfig,
  type StoreConfig,
} from "@/utils/storeConfig";
import type {
  CartItem,
  DeliverySettingsResponse,
  OfferDocument,
  OffersResponse,
  StoreConfigResponse,
} from "@/types/global";

export type CheckoutAbortReason =
  | "store_closed"
  | "store_config_changed"
  | "delivery_settings_changed"
  | "product_held"
  | "sync_error"
  | "promo_added"
  | "cart_drift"
  | "max_quantity_changed"
  | "items_removed"
  | "unexpected_error";

export type CheckoutFlowResult =
  | {
      status: "proceed";
      payableTotal: number;
      orderDiscount: number;
      heldProductIds: string[];
    }
  | {
      status: "abort";
      reason: CheckoutAbortReason;
      message: string;
      toastType: "info" | "error";
      cartUpdated?: boolean;
    };

export type SyncProductResult = {
  productId?: string;
  status?: string;
  oldMaxQuantity?: number | null;
  newMaxQuantity?: number | null;
  oldIsOutOfStock?: boolean | null;
  newIsOutOfStock?: boolean | null;
  oldDiscountedPrice?: number | null;
  newDiscountedPrice?: number | null;
  error?: string | null;
};

export type CheckoutFlowDeps = {
  userId: string;
  cartData: { cart?: { items?: CartItem[] }; orderDiscount?: number } | undefined;
  cachedOffers: OfferDocument[];
  deliverySettings: DeliverySettings;
  storeConfig: StoreConfig;
  orderDiscount?: number;
  now?: Date;
  fetchOffers: () => Promise<OffersResponse | null>;
  fetchDeliverySettings: () => Promise<DeliverySettingsResponse | null>;
  fetchStoreConfig: () => Promise<StoreConfigResponse | null>;
  onPromoConfigPersisted?: (
    offers: OffersResponse,
    delivery: DeliverySettingsResponse,
  ) => void;
  onStoreConfigPersisted?: (store: StoreConfigResponse) => void;
  updateProductsAsPerCart: (payload: {
    items: ReturnType<typeof getPaidCartPayload>;
  }) => Promise<{ data?: SyncProductResult[] }>;
  bulkUpdateCart: (payload: {
    items: ReturnType<typeof getPaidCartPayload>;
  }) => Promise<{ failedItems?: unknown[] }>;
  fetchCart: () => Promise<{ cart?: { items?: CartItem[] }; orderDiscount?: number }>;
  applyPostCheckoutCartUpdate: (
    newCartData: Awaited<ReturnType<CheckoutFlowDeps["fetchCart"]>>,
    syncedProducts: SyncProductResult[] | undefined,
  ) => Promise<void>;
  removeHeldProductsFromCart: (args: {
    heldProductIds: string[];
    currentCartItems: CartItem[];
  }) => Promise<unknown>;
  markCartSynced: () => Promise<void>;
  releaseCheckoutHolds: (productIds: string[]) => Promise<void>;
  mergeCartItemsWithOffers: (
    items: CartItem[],
    offers: OfferDocument[],
  ) => CartItem[];
};

function heldProductMessage(
  preSyncCart: CheckoutFlowDeps["cartData"],
  heldIds: string[],
): string {
  const heldName =
    preSyncCart?.cart?.items?.find(
      (item) =>
        String(item?.productDetails?._id ?? item?.productId) === heldIds[0],
    )?.productDetails?.name ?? "This item";

  return heldIds.length === 1
    ? `${heldName} is being fulfilled for another order and was removed from your cart.`
    : `${heldName} and other items are on hold and were removed from your cart.`;
}

function cartDriftMessage(
  promoChanges: ReturnType<typeof findPromoOfferChanges>,
  changes: ReturnType<typeof findCartChanges>,
  afterCheckoutItems: CartItem[],
): string {
  const removedPromo = promoChanges.removedPromos[0];
  const removedPaid = changes?.removedItems ?? [];
  const removed = removedPromo
    ? [{ productName: removedPromo.productName }]
    : removedPaid;
  const cartNowEmpty = afterCheckoutItems.length === 0;

  if (promoChanges.promoPriceChanges.length > 0) {
    return "An offer price changed. Please review your cart before checkout.";
  }
  if (removed.length > 0) {
    if (cartNowEmpty) {
      return `${removed[0].productName} is no longer available and was removed from your cart.`;
    }
    return `${removed[0].productName} was removed from your cart — an offer may have changed. Please review.`;
  }
  return "Product details or offers changed. Please review before checkout.";
}

export async function runCheckoutFlow(
  deps: CheckoutFlowDeps,
): Promise<CheckoutFlowResult> {
  const {
    cartData,
    cachedOffers,
    deliverySettings,
    storeConfig,
    orderDiscount = cartData?.orderDiscount ?? 0,
    now = new Date(),
    fetchOffers,
    fetchDeliverySettings,
    fetchStoreConfig,
    onPromoConfigPersisted,
    onStoreConfigPersisted,
    updateProductsAsPerCart,
    bulkUpdateCart,
    fetchCart,
    applyPostCheckoutCartUpdate,
    removeHeldProductsFromCart,
    markCartSynced,
    releaseCheckoutHolds,
    mergeCartItemsWithOffers,
  } = deps;

  let heldProductIds: string[] | null = null;

  const releaseHeldProducts = async () => {
    if (!heldProductIds?.length) return;
    const ids = heldProductIds;
    heldProductIds = null;
    try {
      await releaseCheckoutHolds(ids);
    } catch {
      // Best-effort cleanup; TTL still expires holds.
    }
  };

  const abortAfterSync = async (
    result: Extract<CheckoutFlowResult, { status: "abort" }>,
  ): Promise<CheckoutFlowResult> => {
    await releaseHeldProducts();
    return result;
  };

  try {
    const displayedBeforeCheckout = mergeCartItemsWithOffers(
      cartData?.cart?.items ?? [],
      cachedOffers,
    );
    const displayedDeliverySettings = deliverySettings;

    let freshOffersResponse: OffersResponse;
    try {
      const response = await fetchOffers();
      if (response == null) {
        return {
          status: "abort",
          reason: "sync_error",
          message:
            "Could not load latest offers. Check your connection and try again.",
          toastType: "error",
        };
      }
      freshOffersResponse = response;
    } catch {
      return {
        status: "abort",
        reason: "sync_error",
        message:
          "Could not load latest offers. Check your connection and try again.",
        toastType: "error",
      };
    }

    const latestOffers = freshOffersResponse.offers ?? [];

    let latestDeliverySettings = deliverySettings;
    let freshDeliveryResponse: DeliverySettingsResponse | null = null;
    try {
      freshDeliveryResponse = await fetchDeliverySettings();
      latestDeliverySettings = resolveDeliverySettings(
        freshDeliveryResponse?.deliverySettings,
      );
    } catch {
      // use cached delivery settings if refetch fails
    }

    if (freshOffersResponse && freshDeliveryResponse) {
      onPromoConfigPersisted?.(freshOffersResponse, freshDeliveryResponse);
    }

    let latestStoreConfig = storeConfig;
    let freshStoreConfigResponse: StoreConfigResponse | null = null;
    try {
      freshStoreConfigResponse = await fetchStoreConfig();
      latestStoreConfig = resolveStoreConfig(
        freshStoreConfigResponse?.storeConfig,
      );
    } catch {
      // use cached store config if refetch fails
    }

    if (freshStoreConfigResponse) {
      onStoreConfigPersisted?.(freshStoreConfigResponse);
    }

    if (!canAcceptOrders(latestStoreConfig, now)) {
      return {
        status: "abort",
        reason: "store_closed",
        message: getStoreClosedMessage(latestStoreConfig),
        toastType: "info",
      };
    }

    const storeReopenedAfterCache =
      !canAcceptOrders(storeConfig, now) &&
      canAcceptOrders(latestStoreConfig, now);

    if (
      hasStoreConfigChanged(storeConfig, latestStoreConfig) &&
      !storeReopenedAfterCache
    ) {
      return {
        status: "abort",
        reason: "store_config_changed",
        message:
          "Store settings were updated. Please review before checkout.",
        toastType: "info",
      };
    }

    if (
      hasDeliverySettingsChanged(
        displayedDeliverySettings,
        latestDeliverySettings,
      )
    ) {
      return {
        status: "abort",
        reason: "delivery_settings_changed",
        message:
          "Delivery charges were updated. Please review your total before checkout.",
        toastType: "info",
      };
    }

    const preSyncItems = mergeCartItemsWithOffers(
      cartData?.cart?.items ?? [],
      latestOffers,
    );
    const preSyncCart = {
      ...cartData,
      cart: { ...cartData?.cart, items: preSyncItems },
    };
    const syncPayload = getPaidCartPayload(preSyncItems);

    let syncResponse: { data?: SyncProductResult[] };
    try {
      syncResponse = await updateProductsAsPerCart({ items: syncPayload });
      heldProductIds = syncPayload
        .map((item) => String(item.productId))
        .filter(Boolean);
    } catch (error: unknown) {
      const err = error as {
        status?: number;
        data?: { heldProducts?: Array<{ productId: string }>; message?: string; error?: string };
      };
      const heldProducts = err?.data?.heldProducts;

      if (Array.isArray(heldProducts) && heldProducts.length > 0) {
        const heldIds = heldProducts.map((item) => String(item.productId));
        try {
          await removeHeldProductsFromCart({
            heldProductIds: heldIds,
            currentCartItems: preSyncCart?.cart?.items ?? [],
          });
        } catch {
          return {
            status: "abort",
            reason: "product_held",
            message:
              "Item is on hold but could not be removed from cart. Please refresh your cart.",
            toastType: "error",
            cartUpdated: false,
          };
        }

        return {
          status: "abort",
          reason: "product_held",
          message: heldProductMessage(preSyncCart, heldIds),
          toastType: "info",
          cartUpdated: true,
        };
      }

      const fallbackMessage =
        err?.data?.message ||
        err?.data?.error ||
        "Unable to continue checkout. Please try again.";

      return {
        status: "abort",
        reason: "sync_error",
        message: fallbackMessage,
        toastType: "error",
      };
    }

    await bulkUpdateCart({ items: syncPayload });
    await markCartSynced();

    const newCartData = await fetchCart();
    await applyPostCheckoutCartUpdate(newCartData, syncResponse?.data);

    const afterCheckoutItems = newCartData?.cart?.items ?? [];
    const promoChanges = findPromoOfferChanges(
      displayedBeforeCheckout,
      afterCheckoutItems,
    );
    const changes = findCartChanges(
      { cart: { items: getPaidCartItems(displayedBeforeCheckout) } },
      { cart: { items: getPaidCartItems(afterCheckoutItems) } },
    );
    const quantityChanges = findMaxQuantityChanges(preSyncCart, newCartData);

    if (promoChanges.addedPromos.length > 0) {
      const added = promoChanges.addedPromos[0];
      return abortAfterSync({
        status: "abort",
        reason: "promo_added",
        message:
          promoChanges.addedPromos.length === 1
            ? `${added.productName} was added as an offer. Please review your cart before checkout.`
            : "New offers were applied to your cart. Please review before checkout.",
        toastType: "info",
        cartUpdated: true,
      });
    }

    if (
      promoChanges.removedPromos.length > 0 ||
      promoChanges.promoPriceChanges.length > 0 ||
      (changes?.priceChanges.length ?? 0) > 0 ||
      (changes?.removedItems.length ?? 0) > 0
    ) {
      return abortAfterSync({
        status: "abort",
        reason: "cart_drift",
        message: cartDriftMessage(promoChanges, changes, afterCheckoutItems),
        toastType: "info",
        cartUpdated: true,
      });
    }

    if ((quantityChanges?.maxQuantityChanges.length ?? 0) > 0) {
      const limitChange = quantityChanges.maxQuantityChanges[0];
      return abortAfterSync({
        status: "abort",
        reason: "max_quantity_changed",
        message: `Purchase limit updated (max ${limitChange.newMaxQuantity} units). Please review your cart.`,
        toastType: "info",
        cartUpdated: true,
      });
    }

    if ((quantityChanges?.itemsToRemove.length ?? 0) > 0) {
      return abortAfterSync({
        status: "abort",
        reason: "items_removed",
        message: "Product is removed from cart. Please review before checkout.",
        toastType: "info",
        cartUpdated: true,
      });
    }

    const orderDisc = newCartData?.orderDiscount ?? orderDiscount ?? 0;
    const payableTotal = parseFloat(
      Math.max(
        0,
        getPayableTotalFromItems(
          getPaidCartItems(afterCheckoutItems),
          latestDeliverySettings,
        ) - orderDisc,
      ).toFixed(2),
    );

    const proceedHeldProductIds = heldProductIds ?? [];
    heldProductIds = null;

    return {
      status: "proceed",
      payableTotal,
      orderDiscount: orderDisc,
      heldProductIds: proceedHeldProductIds,
    };
  } catch {
    await releaseHeldProducts();
    return {
      status: "abort",
      reason: "unexpected_error",
      message: "Checkout could not continue. Please try again.",
      toastType: "error",
    };
  }
}
