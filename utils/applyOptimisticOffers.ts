import type { CartItem, OfferDocument } from "@/types/global";
import { calculateTotalAmount } from "@/components/cart/utils";
import {
  dedupeCartItems,
  getPaidCartItems,
  isPromoFreebieLine,
} from "./cartOfferUtils";

/**
 * Client-side preview: inject offer freebie lines when paid subtotal qualifies.
 * Same idea as the old hardcoded sugar injection — server confirms on sync.
 */
export function applyOptimisticOffersToCart(
  items: CartItem[] = [],
  offers: OfferDocument[] = [],
): CartItem[] {
  const paidItems = dedupeCartItems(getPaidCartItems(items));
  const paidSubtotal = calculateTotalAmount(paidItems);

  const promoItems: CartItem[] = [];
  const sorted = [...offers]
    .filter((o) => o.enabled && o.type === "freebie")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  for (const offer of sorted) {
    if (paidSubtotal < offer.minOrderValue) continue;

    for (const freebie of offer.freebies ?? []) {
      const snap = freebie.productSnapshot;
      if (!snap?._id) continue;

      const promoPrice = freebie.promoPrice ?? 0;
      const alreadyAdded = promoItems.some(
        (p) => p.offerId === offer.id && p.productId === freebie.productId,
      );
      if (alreadyAdded) continue;

      promoItems.push({
        _id: `promo-${offer.id}-${freebie.productId}`,
        productId: freebie.productId,
        quantity: freebie.quantity ?? 1,
        isPromoFreebie: true,
        offerId: offer.id,
        promoPrice,
        productDetails: {
          ...snap,
          _id: freebie.productId,
          discountedPrice: promoPrice,
        },
      });
    }
  }

  return [...promoItems, ...paidItems];
}

/** Prefer server promo lines when present; otherwise apply optimistic preview. */
export function mergeCartItemsWithOffers(
  items: CartItem[] = [],
  offers: OfferDocument[] = [],
): CartItem[] {
  const hasServerPromos = items.some(isPromoFreebieLine);
  if (hasServerPromos) {
    return dedupeCartItems(items);
  }
  return applyOptimisticOffersToCart(items, offers);
}
