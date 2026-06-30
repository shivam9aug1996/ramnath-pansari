export const DEFAULT_STORE_HOURS = {
  openTime: "09:00",
  closeTime: "21:00",
  timezone: "Asia/Kolkata",
} as const;

export const DEFAULT_DELIVERY_RADIUS = {
  radiusKm: 5,
  centerLatitude: 28.713074,
  centerLongitude: 77.65419,
} as const;

export const DEFAULT_STORE_CONFIG = {
  acceptingOrders: true,
  storeHours: DEFAULT_STORE_HOURS,
  deliveryRadius: DEFAULT_DELIVERY_RADIUS,
} as const;
