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
  const nextOpen = getNextOpenLabel(resolved.storeHours);
  if (nextOpen) {
    return `Store is closed. ${nextOpen}. Orders are accepted between ${resolved.storeHours.openTime} and ${resolved.storeHours.closeTime}.`;
  }
  return `Orders are accepted between ${resolved.storeHours.openTime} and ${resolved.storeHours.closeTime}. Please check back during store hours.`;
}

/** Next open copy when outside scheduled hours; null while open. */
export function getNextOpenLabel(
  storeHours: StoreHoursSettings,
  now: Date = new Date(),
): string | null {
  const resolved = resolveStoreHours(storeHours);
  if (isStoreOpen(resolved, now)) return null;

  const nowMinutes = getZonedMinutes(now, resolved.timezone);
  const openMinutes = parseTimeToMinutes(resolved.openTime);
  if (nowMinutes < openMinutes) {
    return `Opens at ${resolved.openTime}`;
  }
  return `Opens tomorrow at ${resolved.openTime}`;
}

export type HomeStoreStatusKind = "open" | "closed" | "paused";

export type HomeStoreStatus = {
  kind: HomeStoreStatusKind;
  title: string;
  subtitle: string;
  /**
   * How far we are through today's open window (open→close), 0..1.
   * Before open = 0, after close = 1. Null when paused / invalid hours.
   */
  progress: number | null;
  /** e.g. "Closes in 2h 15m" / "Opens in 45m" */
  remainingLabel: string | null;
};

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function formatRemainingMinutes(totalMinutes: number): string {
  const minutes = Math.max(0, Math.ceil(totalMinutes));
  if (minutes <= 1) return "about 1 min";
  if (minutes < 60) return `${minutes} mins`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return hours === 1 ? "1 hour" : `${hours} hours`;
  if (hours === 1) return `1h ${mins}m`;
  return `${hours}h ${mins}m`;
}

/**
 * Progress is always against the full open window (e.g. 09:00–18:00).
 * Remaining minutes still describe time until the next open/close.
 */
export function getStoreScheduleProgress(
  storeHours: StoreHoursSettings,
  now: Date = new Date(),
): { progress: number; remainingMinutes: number; target: "close" | "open" } | null {
  const resolved = resolveStoreHours(storeHours);
  const nowMinutes = getZonedMinutes(now, resolved.timezone);
  const openMinutes = parseTimeToMinutes(resolved.openTime);
  const closeMinutes = parseTimeToMinutes(resolved.closeTime);

  if (closeMinutes <= openMinutes) return null;

  const windowMinutes = closeMinutes - openMinutes;

  // Before today's open — day window hasn't started.
  if (nowMinutes < openMinutes) {
    return {
      target: "open",
      remainingMinutes: openMinutes - nowMinutes,
      progress: 0,
    };
  }

  // During open hours — fill against the complete open→close span.
  if (nowMinutes < closeMinutes) {
    const elapsedMinutes = nowMinutes - openMinutes;
    return {
      target: "close",
      remainingMinutes: closeMinutes - nowMinutes,
      progress: clamp01(elapsedMinutes / windowMinutes),
    };
  }

  // After close — open window is complete; countdown is until tomorrow's open.
  return {
    target: "open",
    remainingMinutes: openMinutes + 24 * 60 - nowMinutes,
    progress: 1,
  };
}

/** Compact status for the home feed banner. */
export function getHomeStoreStatus(
  storeConfig: StoreConfig | Partial<StoreConfig>,
  now: Date = new Date(),
): HomeStoreStatus {
  const resolved = resolveStoreConfig(storeConfig);
  const hoursLabel = formatStoreHoursLabel(resolved.storeHours);

  if (!resolved.acceptingOrders) {
    return {
      kind: "paused",
      title: "Not accepting orders right now",
      subtitle: `Usual hours ${hoursLabel}`,
      progress: null,
      remainingLabel: null,
    };
  }

  const schedule = getStoreScheduleProgress(resolved.storeHours, now);

  if (isStoreOpen(resolved.storeHours, now)) {
    const remainingLabel = schedule
      ? `Closes in ${formatRemainingMinutes(schedule.remainingMinutes)}`
      : null;
    return {
      kind: "open",
      title: "Store open",
      subtitle: remainingLabel
        ? `${remainingLabel} · ${hoursLabel}`
        : hoursLabel,
      progress: schedule?.progress ?? null,
      remainingLabel,
    };
  }

  const nextOpen = getNextOpenLabel(resolved.storeHours, now);
  const remainingLabel = schedule
    ? `Opens in ${formatRemainingMinutes(schedule.remainingMinutes)}`
    : null;

  return {
    kind: "closed",
    title: "Store closed",
    subtitle: remainingLabel ?? nextOpen ?? `Hours ${hoursLabel}`,
    progress: schedule?.progress ?? null,
    remainingLabel,
  };
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
