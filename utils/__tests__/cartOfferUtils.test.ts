import {
  computeAppliedOrderDiscounts,
  computeOrderDiscountFromOffers,
  findPromoOfferChanges,
  getPaidCartItems,
  getPaidCartPayload,
} from "@/utils/cartOfferUtils";
import type { CartItem, OfferDocument } from "@/types/global";

function line(
  id: string,
  name: string,
  price: number,
  extras: Partial<CartItem> = {},
): CartItem {
  return {
    productId: id,
    quantity: 1,
    productDetails: {
      _id: id,
      name,
      discountedPrice: price,
    } as CartItem["productDetails"],
    ...extras,
  } as CartItem;
}

describe("cartOfferUtils", () => {
  it("excludes promo freebies from paid payload", () => {
    const items = [
      line("p1", "Ghee", 100),
      line("gift", "Free Item", 0, { isPromoFreebie: true, offerId: "o1" }),
    ];

    expect(getPaidCartItems(items)).toHaveLength(1);
    expect(getPaidCartPayload(items)).toEqual([
      { productId: "p1", quantity: 1 },
    ]);
  });

  it("detects newly added promo lines", () => {
    const prev = [line("p1", "Ghee", 100)];
    const next = [
      ...prev,
      line("gift", "Free Snack", 0, { isPromoFreebie: true, offerId: "o1" }),
    ];

    const result = findPromoOfferChanges(prev, next);

    expect(result.addedPromos).toHaveLength(1);
    expect(result.addedPromos[0].productName).toBe("Free Snack");
  });

  it("detects promo price changes", () => {
    const prev = [
      line("gift", "Free Snack", 0, {
        isPromoFreebie: true,
        offerId: "o1",
        promoPrice: 0,
      }),
    ];
    const next = [
      line("gift", "Free Snack", 0, {
        isPromoFreebie: true,
        offerId: "o1",
        promoPrice: 10,
      }),
    ];

    const result = findPromoOfferChanges(prev, next);

    expect(result.promoPriceChanges).toHaveLength(1);
    expect(result.promoPriceChanges[0]).toMatchObject({
      oldPrice: 0,
      newPrice: 10,
    });
  });

  it("computes stacked flat and percent order discounts", () => {
    const offers: OfferDocument[] = [
      {
        id: "freebie",
        enabled: true,
        type: "freebie",
        minOrderValue: 500,
        sortOrder: 1,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "flat",
        enabled: true,
        type: "discount",
        minOrderValue: 1000,
        sortOrder: 2,
        discount: { kind: "flat", value: 50, label: "₹50 off" },
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "pct",
        enabled: true,
        type: "discount",
        minOrderValue: 1500,
        sortOrder: 3,
        discount: { kind: "percent", value: 5, maxDiscount: 100, label: "5% off" },
        createdAt: "",
        updatedAt: "",
      },
    ];

    expect(computeOrderDiscountFromOffers(999, offers)).toBe(0);

    const at1500 = computeAppliedOrderDiscounts(1662, offers);
    expect(at1500).toHaveLength(2);
    expect(at1500[0]).toMatchObject({
      label: "₹50 off on ₹1000+ orders",
      amount: 50,
    });
    expect(at1500[1]).toMatchObject({
      label: "5% off on ₹1500+ orders",
      amount: 83.1,
    });
    expect(computeOrderDiscountFromOffers(1662, offers)).toBe(133.1);
  });
});
