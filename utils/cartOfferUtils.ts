import type { CartItem, DiscountReward, OfferDocument } from "@/types/global";
import { getOfferLabel } from "@/utils/offerMilestones";

export type AppliedOrderDiscount = {
  offerId: string;
  label: string;
  amount: number;
};

export function isPromoFreebieLine(item: CartItem): boolean {
  return Boolean(item?.isPromoFreebie);
}

export function getPaidCartItems(items: CartItem[] = []): CartItem[] {
  return items.filter((item) => !isPromoFreebieLine(item));
}

/** Promo lines and legacy ₹0 items — excluded from catalog MRP / discount rows. */
export function isOfferGiftLine(item: CartItem): boolean {
  if (isPromoFreebieLine(item)) return true;
  return (item?.productDetails?.discountedPrice ?? 0) === 0;
}

export function getCatalogBillItems(items: CartItem[] = []): CartItem[] {
  return items.filter((item) => !isOfferGiftLine(item));
}

export function getPaidCartPayload(items: CartItem[] = []) {
  return getPaidCartItems(items).map((item) => ({
    productId: item?.productDetails?._id ?? item?.productId,
    quantity: item?.quantity ?? 0,
  }));
}

/** Paid catalog lines only — promo freebies are excluded from Redis checkout locks. */
export function getLockableProductIds(items: CartItem[] = []): string[] {
  return getPaidCartItems(items)
    .map((item) => String(item?.productDetails?._id ?? item?.productId ?? ""))
    .filter(Boolean)
    .filter((id, index, arr) => arr.indexOf(id) === index);
}

export function getPaidSubtotalFromItems(
  items: CartItem[] = [],
  calc: (items: CartItem[]) => number,
): number {
  return calc(getPaidCartItems(items));
}

function computeDiscountAmount(
  paidSubtotal: number,
  discount: DiscountReward,
): number {
  let amount =
    discount.kind === "flat"
      ? discount.value
      : paidSubtotal * (discount.value / 100);
  if (discount.maxDiscount != null) {
    amount = Math.min(amount, discount.maxDiscount);
  }
  return parseFloat(Math.max(0, amount).toFixed(2));
}

/** Each qualifying discount offer as its own line item for cart / order UI. */
export function computeAppliedOrderDiscounts(
  paidSubtotal: number,
  offers: OfferDocument[] = [],
): AppliedOrderDiscount[] {
  const sorted = [...offers].sort((a, b) => a.sortOrder - b.sortOrder);
  const applied: AppliedOrderDiscount[] = [];

  for (const offer of sorted) {
    if (!offer.enabled || paidSubtotal < offer.minOrderValue) continue;
    if (offer.type === "discount" && offer.discount) {
      applied.push({
        offerId: offer.id,
        label: getOfferLabel(offer),
        amount: computeDiscountAmount(paidSubtotal, offer.discount),
      });
    }
  }

  return applied;
}

/** Mirrors server applyOffersToCart discount stacking for cart UI preview. */
export function computeOrderDiscountFromOffers(
  paidSubtotal: number,
  offers: OfferDocument[] = [],
): number {
  return parseFloat(
    computeAppliedOrderDiscounts(paidSubtotal, offers)
      .reduce((sum, item) => sum + item.amount, 0)
      .toFixed(2),
  );
}

function promoLineKey(item: CartItem): string {
  const id = item?.productDetails?._id ?? item?.productId ?? "";
  return `${item?.offerId ?? "promo"}:${String(id)}`;
}

function effectivePromoPrice(item: CartItem): number {
  return item?.promoPrice ?? item?.productDetails?.discountedPrice ?? 0;
}

export type PromoOfferChange = {
  productId: string;
  productName: string;
  promoPrice: number;
};

export type PromoPriceChange = {
  productName: string;
  oldPrice: number;
  newPrice: number;
};

/** Compare promo/freebie lines between what the user saw and the server cart. */
export function findPromoOfferChanges(
  prevItems: CartItem[] = [],
  nextItems: CartItem[] = [],
): {
  addedPromos: PromoOfferChange[];
  removedPromos: PromoOfferChange[];
  promoPriceChanges: PromoPriceChange[];
} {
  const prevPromos = prevItems.filter(isPromoFreebieLine);
  const nextPromos = nextItems.filter(isPromoFreebieLine);
  const prevByKey = new Map(prevPromos.map((item) => [promoLineKey(item), item]));

  const addedPromos: PromoOfferChange[] = [];
  const promoPriceChanges: PromoPriceChange[] = [];

  for (const next of nextPromos) {
    const key = promoLineKey(next);
    const prev = prevByKey.get(key);

    if (!prev) {
      addedPromos.push({
        productId: String(next?.productDetails?._id ?? next?.productId ?? ""),
        productName: next?.productDetails?.name ?? "Offer item",
        promoPrice: effectivePromoPrice(next),
      });
      continue;
    }

    const oldPrice = effectivePromoPrice(prev);
    const newPrice = effectivePromoPrice(next);
    if (oldPrice !== newPrice) {
      promoPriceChanges.push({
        productName: next?.productDetails?.name ?? "Offer item",
        oldPrice,
        newPrice,
      });
    }
    prevByKey.delete(key);
  }

  const removedPromos = [...prevByKey.values()].map((item) => ({
    productId: String(item?.productDetails?._id ?? item?.productId ?? ""),
    productName: item?.productDetails?.name ?? "Offer item",
    promoPrice: effectivePromoPrice(item),
  }));

  return { addedPromos, removedPromos, promoPriceChanges };
}

/** Remove legacy free lines when a promo line exists for the same product at ₹0. */
export function dedupeCartItems(items: CartItem[] = []): CartItem[] {
  const promoByProduct = new Map<string, number>();
  for (const item of items) {
    if (!isPromoFreebieLine(item)) continue;
    const id = item?.productDetails?._id ?? item?.productId;
    if (id) {
      promoByProduct.set(
        String(id),
        item?.promoPrice ?? item?.productDetails?.discountedPrice ?? 0,
      );
    }
  }

  return items.filter((item) => {
    if (isPromoFreebieLine(item)) return true;
    const id = String(item?.productDetails?._id ?? item?.productId ?? "");
    const promoPrice = promoByProduct.get(id);
    if (promoPrice == null) return true;
    const linePrice = item?.productDetails?.discountedPrice ?? 0;
    return linePrice > promoPrice;
  });
}
