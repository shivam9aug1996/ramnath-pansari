import { getCartPriceBreakdown } from "@/utils/cartPriceBreakdown";
import type { CartItem } from "@/types/global";

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
      price: price + 50,
      discountedPrice: price,
    } as CartItem["productDetails"],
    ...extras,
  } as CartItem;
}

describe("getCartPriceBreakdown", () => {
  it("orders lines so item total + offers - discounts match subtotal math", () => {
    const items = [
      line("p1", "Rice", 1924),
      {
        ...line("p2", "Maida2", 5, {
          isPromoFreebie: true,
          offerId: "offer-1",
          promoPrice: 5,
        }),
        productDetails: {
          _id: "p2",
          name: "Maida2",
          price: 300,
          discountedPrice: 5,
        } as CartItem["productDetails"],
      },
    ];

    const offers = [
      {
        id: "offer-1",
        enabled: true,
        type: "freebie" as const,
        minOrderValue: 1000,
        sortOrder: 0,
        freebies: [{ productId: "p2", quantity: 1, promoPrice: 5 }],
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "offer-2",
        enabled: true,
        type: "discount" as const,
        minOrderValue: 1500,
        sortOrder: 1,
        discount: { kind: "flat" as const, value: 100 },
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "offer-3",
        enabled: true,
        type: "discount" as const,
        minOrderValue: 1500,
        sortOrder: 2,
        discount: { kind: "percent" as const, value: 5 },
        createdAt: "",
        updatedAt: "",
      },
    ];

    const breakdown = getCartPriceBreakdown(items, offers);

    expect(breakdown.catalogSubtotal).toBe(1924);
    expect(breakdown.subtotal).toBe(1929);
    expect(breakdown.hasOfferLines).toBe(true);
    expect(breakdown.freebies).toHaveLength(1);
    expect(breakdown.orderDiscount).toBe(196.2);
    expect(breakdown.totalSaved).toBeGreaterThan(breakdown.orderDiscount);
  });
});
