import type { CartItem } from "@/types/global";
import { DEFAULT_DELIVERY_SETTINGS } from "@/constants/Delivery";
import { DEFAULT_STORE_CONFIG } from "@/constants/StoreConfig";
import type { CheckoutFlowDeps } from "@/utils/runCheckoutFlow";

export const OPEN_NOW = new Date("2026-06-17T06:30:00.000Z");
export const CLOSED_NOW = new Date("2026-06-17T02:00:00.000Z");

export function makePaidItem(
  id: string,
  name: string,
  price: number,
  qty = 1,
  extras: Partial<CartItem> = {},
): CartItem {
  return {
    productId: id,
    quantity: qty,
    productDetails: {
      _id: id,
      name,
      discountedPrice: price,
      maxQuantity: 5,
    } as CartItem["productDetails"],
    ...extras,
  } as CartItem;
}

export function createCheckoutDeps(
  overrides: Partial<CheckoutFlowDeps> = {},
): CheckoutFlowDeps {
  const item = makePaidItem("p1", "Ghee", 250, 2);
  const deliverySettings = { ...DEFAULT_DELIVERY_SETTINGS };
  const storeConfig = { ...DEFAULT_STORE_CONFIG };

  return {
    userId: "user-1",
    cartData: { cart: { items: [item] }, orderDiscount: 0 },
    cachedOffers: [],
    deliverySettings,
    storeConfig,
    orderDiscount: 0,
    now: OPEN_NOW,
    fetchOffers: jest.fn().mockResolvedValue({ offers: [] }),
    fetchDeliverySettings: jest
      .fn()
      .mockResolvedValue({ deliverySettings }),
    fetchStoreConfig: jest.fn().mockResolvedValue({ storeConfig }),
    updateProductsAsPerCart: jest.fn().mockResolvedValue({ data: [] }),
    bulkUpdateCart: jest.fn().mockResolvedValue({ failedItems: [] }),
    fetchCart: jest.fn().mockResolvedValue({
      cart: { items: [item] },
      orderDiscount: 0,
    }),
    applyPostCheckoutCartUpdate: jest.fn().mockResolvedValue(undefined),
    removeHeldProductsFromCart: jest.fn().mockResolvedValue({}),
    markCartSynced: jest.fn().mockResolvedValue(undefined),
    releaseCheckoutHolds: jest.fn().mockResolvedValue(undefined),
    mergeCartItemsWithOffers: (items) => items,
    ...overrides,
  };
}
