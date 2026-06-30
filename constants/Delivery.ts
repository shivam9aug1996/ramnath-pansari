export const DEFAULT_DELIVERY_SETTINGS = {
  freeDeliveryMin: 200,
  shippingFee: 50,
} as const;

/** @deprecated Use DEFAULT_DELIVERY_SETTINGS or useDeliverySettings() */
export const FREE_DELIVERY_MIN = DEFAULT_DELIVERY_SETTINGS.freeDeliveryMin;

/** @deprecated Use DEFAULT_DELIVERY_SETTINGS or useDeliverySettings() */
export const SHIPPING_FEE = DEFAULT_DELIVERY_SETTINGS.shippingFee;
