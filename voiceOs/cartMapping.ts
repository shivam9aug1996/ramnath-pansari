import type { CartContextItem } from "./types";

/**
 * Single cart-item mapper for Voice OS session + tools.
 * Prefer productDetails (checkout/sync shape), fall back to populated productId.
 */
export function mapCartItemsFromApi(cartData: unknown): CartContextItem[] {
  const rawItems =
    (cartData as { cart?: { items?: unknown[] } } | null)?.cart?.items ?? [];

  return rawItems.map((raw) => {
    const item = raw as Record<string, any>;
    const details =
      item?.productDetails && typeof item.productDetails === "object"
        ? item.productDetails
        : item?.productId && typeof item.productId === "object"
          ? item.productId
          : {};

    const productId = String(
      details?._id ??
        (typeof item?.productId === "string" ? item.productId : "") ??
        "",
    );
    const quantity = Number(item?.quantity ?? 0);
    const unitPrice = Number(
      details?.discountedPrice ??
        item?.discountedPrice ??
        details?.price ??
        item?.price ??
        0,
    );

    return {
      productId,
      name: details?.name ?? item?.name,
      quantity,
      unitPrice: Number.isFinite(unitPrice) ? unitPrice : null,
      lineTotal:
        Number.isFinite(unitPrice) && quantity
          ? Number((unitPrice * quantity).toFixed(2))
          : null,
    };
  });
}
