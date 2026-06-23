import { GO_TO_CART_ESTIMATED_HEIGHT } from "@/app/(private)/(category)/ProductList/productListLayout";

/** Matches `(tabs)/_layout.tsx` tabBarStyle.height = content + safe area */
export const TAB_BAR_CONTENT_HEIGHT = 40;

/** Fallback until Continue footer onLayout measures */
export const CART_CHECKOUT_FOOTER_ESTIMATE = 140;

export function getTabBarReservedHeight(safeAreaBottom: number) {
  return TAB_BAR_CONTENT_HEIGHT + safeAreaBottom;
}

export function getGoToCartFallbackInset(lastMeasured = 0) {
  return lastMeasured > 0 ? lastMeasured : GO_TO_CART_ESTIMATED_HEIGHT;
}

export function getCartFooterFallbackInset(lastMeasured = 0) {
  return lastMeasured > 0 ? lastMeasured : CART_CHECKOUT_FOOTER_ESTIMATE;
}
