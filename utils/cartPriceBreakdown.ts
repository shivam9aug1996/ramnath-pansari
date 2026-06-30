import { calculateSavingsAndFreebies } from "@/app/(private)/(orderDetail)/utils";
import {
  calculateCatalogMrp,
  calculateCatalogSubtotal,
  calculateTotalAmount,
} from "@/components/cart/utils";
import type { CartItem, OfferDocument } from "@/types/global";
import { computeAppliedOrderDiscounts } from "@/utils/cartOfferUtils";
import { getPaidCartSubtotal } from "@/utils/deliveryFee";

export function getCartPriceBreakdown(
  items: CartItem[] = [],
  offers: OfferDocument[] = [],
  serverOrderDiscount = 0,
) {
  const { freebieValue, freebies } = calculateSavingsAndFreebies(items);
  const mrpTotal = calculateCatalogMrp(items);
  const catalogSubtotal = calculateCatalogSubtotal(items);
  const subtotal = calculateTotalAmount(items);
  const productDiscount = Math.max(0, mrpTotal - catalogSubtotal);
  const paidSubtotal = getPaidCartSubtotal(items);
  const appliedOrderDiscounts = computeAppliedOrderDiscounts(
    paidSubtotal,
    offers,
  );
  const computedOrderDiscount = appliedOrderDiscounts.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const orderDiscount = Math.max(
    parseFloat(computedOrderDiscount.toFixed(2)),
    serverOrderDiscount,
  );
  const totalSaved = parseFloat(
    (productDiscount + freebieValue + orderDiscount).toFixed(2),
  );

  return {
    catalogSubtotal,
    subtotal,
    productDiscount,
    freebieValue,
    freebies,
    appliedOrderDiscounts,
    orderDiscount,
    totalSaved,
    hasOfferLines: freebies.length > 0,
  };
}
