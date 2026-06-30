import {
  DEFAULT_DELIVERY_RADIUS,
  DEFAULT_STORE_HOURS,
} from "@/constants/StoreConfig";

export type StoreHoursSettings = {
  openTime: string;
  closeTime: string;
  timezone: string;
};

export type DeliveryRadiusSettings = {
  radiusKm: number;
  centerLatitude: number;
  centerLongitude: number;
};

export type StoreConfig = {
  /** When false, orders are blocked regardless of scheduled hours. */
  acceptingOrders: boolean;
  storeHours: StoreHoursSettings;
  deliveryRadius: DeliveryRadiusSettings;
};

export function resolveStoreHours(
  settings?: Partial<StoreHoursSettings> | null,
): StoreHoursSettings {
  return {
    openTime: settings?.openTime ?? DEFAULT_STORE_HOURS.openTime,
    closeTime: settings?.closeTime ?? DEFAULT_STORE_HOURS.closeTime,
    timezone: settings?.timezone ?? DEFAULT_STORE_HOURS.timezone,
  };
}

export function resolveDeliveryRadius(
  settings?: Partial<DeliveryRadiusSettings> | null,
): DeliveryRadiusSettings {
  return {
    radiusKm: settings?.radiusKm ?? DEFAULT_DELIVERY_RADIUS.radiusKm,
    centerLatitude:
      settings?.centerLatitude ?? DEFAULT_DELIVERY_RADIUS.centerLatitude,
    centerLongitude:
      settings?.centerLongitude ?? DEFAULT_DELIVERY_RADIUS.centerLongitude,
  };
}

export function resolveStoreConfig(
  config?: Partial<StoreConfig> | null,
): StoreConfig {
  return {
    acceptingOrders: config?.acceptingOrders !== false,
    storeHours: resolveStoreHours(config?.storeHours),
    deliveryRadius: resolveDeliveryRadius(config?.deliveryRadius),
  };
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function getZonedMinutes(date: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function isStoreOpen(
  storeHours: StoreHoursSettings,
  now: Date = new Date(),
): boolean {
  const resolved = resolveStoreHours(storeHours);
  const nowMinutes = getZonedMinutes(now, resolved.timezone);
  const openMinutes = parseTimeToMinutes(resolved.openTime);
  const closeMinutes = parseTimeToMinutes(resolved.closeTime);
  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}

export function canAcceptOrders(
  storeConfig: StoreConfig | Partial<StoreConfig>,
  now: Date = new Date(),
): boolean {
  const resolved = resolveStoreConfig(storeConfig);
  if (!resolved.acceptingOrders) return false;
  return isStoreOpen(resolved.storeHours, now);
}

export function formatStoreHoursLabel(storeHours: StoreHoursSettings): string {
  const resolved = resolveStoreHours(storeHours);
  return `${resolved.openTime} – ${resolved.closeTime}`;
}

export function getStoreClosedMessage(
  storeConfig: StoreConfig | Partial<StoreConfig>,
): string {
  const resolved = resolveStoreConfig(storeConfig);
  if (!resolved.acceptingOrders) {
    return "We're not accepting orders right now. Please check back later.";
  }
  return `Orders are accepted between ${resolved.storeHours.openTime} and ${resolved.storeHours.closeTime}. Please check back during store hours.`;
}

/** Soft hint when cached config says closed; checkout still runs to refresh status. */
export function getStoreClosedCacheHint(
  storeConfig: StoreConfig | Partial<StoreConfig>,
  now?: Date,
): string | null {
  if (canAcceptOrders(storeConfig, now)) return null;
  return `${getStoreClosedMessage(storeConfig)} Tap Checkout to check the latest status.`;
}

export function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function checkDeliveryRadius(
  selectedLocation: { latitude: number; longitude: number },
  deliveryRadius: DeliveryRadiusSettings,
): { isWithin: boolean; distance: string } {
  const resolved = resolveDeliveryRadius(deliveryRadius);
  const distanceKm = getDistanceKm(
    resolved.centerLatitude,
    resolved.centerLongitude,
    selectedLocation.latitude,
    selectedLocation.longitude,
  );
  return {
    isWithin: distanceKm <= resolved.radiusKm,
    distance: distanceKm.toFixed(1),
  };
}

export function hasStoreConfigChanged(
  prev: StoreConfig,
  latest: StoreConfig,
): boolean {
  const a = resolveStoreConfig(prev);
  const b = resolveStoreConfig(latest);
  return (
    a.acceptingOrders !== b.acceptingOrders ||
    a.storeHours.openTime !== b.storeHours.openTime ||
    a.storeHours.closeTime !== b.storeHours.closeTime ||
    a.storeHours.timezone !== b.storeHours.timezone ||
    a.deliveryRadius.radiusKm !== b.deliveryRadius.radiusKm ||
    a.deliveryRadius.centerLatitude !== b.deliveryRadius.centerLatitude ||
    a.deliveryRadius.centerLongitude !== b.deliveryRadius.centerLongitude
  );
}
