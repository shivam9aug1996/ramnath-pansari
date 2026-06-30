import type { CartItem } from "@/types/global";
import { DEFAULT_DELIVERY_SETTINGS } from "@/constants/Delivery";
import { DEFAULT_STORE_CONFIG } from "@/constants/StoreConfig";
import {
  runCheckoutFlow,
} from "@/utils/runCheckoutFlow";
import {
  createCheckoutDeps,
  makePaidItem,
} from "@/utils/checkoutFlowTestHelpers";

const OPEN_NOW = new Date("2026-06-17T06:30:00.000Z");
const CLOSED_NOW = new Date("2026-06-17T02:00:00.000Z");

describe("runCheckoutFlow", () => {
  it("continues with cached config when offer fetch fails", async () => {
    const deps = createCheckoutDeps({
      fetchOffers: jest.fn().mockRejectedValue(new Error("network")),
    });

    const result = await runCheckoutFlow(deps);

    expect(result.status).toBe("proceed");
    expect(deps.fetchOffers).toHaveBeenCalled();
  });

  it("aborts when store is closed", async () => {
    const deps = createCheckoutDeps({ now: CLOSED_NOW });

    const result = await runCheckoutFlow(deps);

    expect(result).toMatchObject({
      status: "abort",
      reason: "store_closed",
      toastType: "info",
    });
  });

  it("aborts when store is manually closed for orders", async () => {
    const deps = createCheckoutDeps({
      now: OPEN_NOW,
      fetchStoreConfig: jest.fn().mockResolvedValue({
        storeConfig: {
          ...DEFAULT_STORE_CONFIG,
          acceptingOrders: false,
        },
      }),
    });

    const result = await runCheckoutFlow(deps);

    expect(result).toMatchObject({
      status: "abort",
      reason: "store_closed",
      toastType: "info",
    });
  });

  it("proceeds when store reopens after stale cached closed state", async () => {
    const deps = createCheckoutDeps({
      now: OPEN_NOW,
      storeConfig: {
        ...DEFAULT_STORE_CONFIG,
        acceptingOrders: false,
      },
      fetchStoreConfig: jest.fn().mockResolvedValue({
        storeConfig: DEFAULT_STORE_CONFIG,
      }),
    });

    const result = await runCheckoutFlow(deps);

    expect(result.status).toBe("proceed");
  });

  it("aborts when store config changed", async () => {
    const deps = createCheckoutDeps({
      fetchStoreConfig: jest.fn().mockResolvedValue({
        storeConfig: {
          storeHours: {
            openTime: "10:00",
            closeTime: "21:00",
            timezone: "Asia/Kolkata",
          },
          deliveryRadius: DEFAULT_STORE_CONFIG.deliveryRadius,
        },
      }),
    });

    const result = await runCheckoutFlow(deps);

    expect(result).toMatchObject({
      status: "abort",
      reason: "store_config_changed",
      toastType: "info",
    });
  });

  it("aborts when delivery settings changed", async () => {
    const deps = createCheckoutDeps({
      deliverySettings: DEFAULT_DELIVERY_SETTINGS,
      fetchDeliverySettings: jest.fn().mockResolvedValue({
        deliverySettings: {
          freeDeliveryMin: 999,
          shippingFee: 50,
        },
      }),
    });

    const result = await runCheckoutFlow(deps);

    expect(result).toMatchObject({
      status: "abort",
      reason: "delivery_settings_changed",
      toastType: "info",
    });
  });

  it("aborts and removes held products on 409", async () => {
    const item = makePaidItem("p1", "Ghee", 250);
    const deps = createCheckoutDeps({
      cartData: { cart: { items: [item] } },
      updateProductsAsPerCart: jest.fn().mockRejectedValue({
        status: 409,
        data: { heldProducts: [{ productId: "p1" }] },
      }),
    });

    const result = await runCheckoutFlow(deps);

    expect(deps.removeHeldProductsFromCart).toHaveBeenCalledWith({
      heldProductIds: ["p1"],
      currentCartItems: [item],
    });
    expect(result).toMatchObject({
      status: "abort",
      reason: "product_held",
      toastType: "info",
      cartUpdated: true,
    });
  });

  it("aborts with error when held product removal fails", async () => {
    const deps = createCheckoutDeps({
      updateProductsAsPerCart: jest.fn().mockRejectedValue({
        status: 409,
        data: { heldProducts: [{ productId: "p1" }] },
      }),
      removeHeldProductsFromCart: jest
        .fn()
        .mockRejectedValue(new Error("bulk failed")),
    });

    const result = await runCheckoutFlow(deps);

    expect(result).toMatchObject({
      status: "abort",
      reason: "product_held",
      toastType: "error",
    });
  });

  it("aborts on generic sync error", async () => {
    const deps = createCheckoutDeps({
      updateProductsAsPerCart: jest.fn().mockRejectedValue({
        status: 500,
        data: { message: "Server busy" },
      }),
    });

    const result = await runCheckoutFlow(deps);

    expect(result).toMatchObject({
      status: "abort",
      reason: "sync_error",
      message: "Server busy",
      toastType: "error",
    });
  });

  it("aborts on unexpected bulk update failure", async () => {
    const deps = createCheckoutDeps({
      bulkUpdateCart: jest.fn().mockRejectedValue(new Error("bulk failed")),
    });

    const result = await runCheckoutFlow(deps);

    expect(result).toMatchObject({
      status: "abort",
      reason: "unexpected_error",
      toastType: "error",
    });
  });

  it("aborts when a new promo is added after sync", async () => {
    const paid = makePaidItem("p1", "Ghee", 250);
    const withPromo = [
      paid,
      makePaidItem("gift1", "Free Snack", 0, 1, {
        isPromoFreebie: true,
        offerId: "offer-1",
      }),
    ];

    const deps = createCheckoutDeps({
      cartData: { cart: { items: [paid] } },
      fetchCart: jest.fn().mockResolvedValue({ cart: { items: withPromo } }),
    });

    const result = await runCheckoutFlow(deps);

    expect(result).toMatchObject({
      status: "abort",
      reason: "promo_added",
      toastType: "info",
      cartUpdated: true,
    });
  });

  it("aborts when paid item price changes after sync", async () => {
    const before = makePaidItem("p1", "Ghee", 250);
    const after = makePaidItem("p1", "Ghee", 299);

    const deps = createCheckoutDeps({
      cartData: { cart: { items: [before] } },
      fetchCart: jest.fn().mockResolvedValue({ cart: { items: [after] } }),
    });

    const result = await runCheckoutFlow(deps);

    expect(result).toMatchObject({
      status: "abort",
      reason: "cart_drift",
      toastType: "info",
      cartUpdated: true,
    });
  });

  it("aborts when max quantity is lowered below cart qty", async () => {
    const before = makePaidItem("p1", "Ghee", 250, 3, {
      productDetails: {
        _id: "p1",
        name: "Ghee",
        discountedPrice: 250,
        maxQuantity: 5,
      } as CartItem["productDetails"],
    });
    const after = makePaidItem("p1", "Ghee", 250, 2, {
      productDetails: {
        _id: "p1",
        name: "Ghee",
        discountedPrice: 250,
        maxQuantity: 2,
      } as CartItem["productDetails"],
    });

    const deps = createCheckoutDeps({
      cartData: { cart: { items: [before] } },
      fetchCart: jest.fn().mockResolvedValue({ cart: { items: [after] } }),
    });

    const result = await runCheckoutFlow(deps);

    expect(result).toMatchObject({
      status: "abort",
      reason: "max_quantity_changed",
      toastType: "info",
    });
  });

  it("aborts when item is marked for removal", async () => {
    const before = makePaidItem("p1", "Ghee", 250, 1, {
      productDetails: {
        _id: "p1",
        name: "Ghee",
        discountedPrice: 250,
        maxQuantity: 5,
      } as CartItem["productDetails"],
    });
    const after = makePaidItem("p1", "Ghee", 250, 1, {
      productDetails: {
        _id: "p1",
        name: "Ghee",
        discountedPrice: 250,
        maxQuantity: 0,
      } as CartItem["productDetails"],
    });

    const deps = createCheckoutDeps({
      cartData: { cart: { items: [before] } },
      fetchCart: jest.fn().mockResolvedValue({ cart: { items: [after] } }),
    });

    const result = await runCheckoutFlow(deps);

    expect(result).toMatchObject({
      status: "abort",
      reason: "items_removed",
      toastType: "info",
    });
  });

  it("proceeds with payable total when all checks pass", async () => {
    const item = makePaidItem("p1", "Ghee", 250, 2);
    const deps = createCheckoutDeps({
      cartData: { cart: { items: [item] }, orderDiscount: 0 },
      fetchCart: jest.fn().mockResolvedValue({
        cart: { items: [item] },
        orderDiscount: 0,
      }),
    });

    const result = await runCheckoutFlow(deps);

    expect(result).toEqual({
      status: "proceed",
      payableTotal: 500,
      orderDiscount: 0,
      heldProductIds: ["p1"],
    });
    expect(deps.updateProductsAsPerCart).toHaveBeenCalled();
    expect(deps.bulkUpdateCart).toHaveBeenCalled();
    expect(deps.fetchCart).toHaveBeenCalled();
    expect(deps.applyPostCheckoutCartUpdate).toHaveBeenCalled();
    expect(deps.markCartSynced).toHaveBeenCalled();
    expect(deps.releaseCheckoutHolds).not.toHaveBeenCalled();
  });

  it("applies order discount to payable total", async () => {
    const item = makePaidItem("p1", "Ghee", 250, 2);
    const deps = createCheckoutDeps({
      cartData: { cart: { items: [item] }, orderDiscount: 50 },
      fetchCart: jest.fn().mockResolvedValue({
        cart: { items: [item] },
        orderDiscount: 50,
      }),
    });

    const result = await runCheckoutFlow(deps);

    expect(result).toMatchObject({
      status: "proceed",
      payableTotal: 450,
      orderDiscount: 50,
      heldProductIds: ["p1"],
    });
  });

  it("releases holds when cart drift aborts after sync", async () => {
    const before = makePaidItem("p1", "Ghee", 250);
    const after = makePaidItem("p1", "Ghee", 299);
    const deps = createCheckoutDeps({
      cartData: { cart: { items: [before] } },
      fetchCart: jest.fn().mockResolvedValue({ cart: { items: [after] } }),
    });

    const result = await runCheckoutFlow(deps);

    expect(result).toMatchObject({
      status: "abort",
      reason: "cart_drift",
    });
    expect(deps.releaseCheckoutHolds).toHaveBeenCalledWith(["p1"]);
  });

  it("releases holds when bulk update fails after sync", async () => {
    const deps = createCheckoutDeps({
      bulkUpdateCart: jest.fn().mockRejectedValue(new Error("bulk failed")),
    });

    const result = await runCheckoutFlow(deps);

    expect(result).toMatchObject({
      status: "abort",
      reason: "unexpected_error",
    });
    expect(deps.releaseCheckoutHolds).toHaveBeenCalledWith(["p1"]);
  });
});
