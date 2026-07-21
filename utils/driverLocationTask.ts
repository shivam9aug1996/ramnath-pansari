import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { Linking, Platform } from "react-native";
import { push, ref } from "firebase/database";
import { database } from "@/firebase";

export const DRIVER_LOCATION_TASK = "DRIVER_LOCATION_TASK";
export const ACTIVE_DRIVER_ORDER_KEY = "activeDriverOrderId";
export const ACTIVE_DRIVER_ID_KEY = "activeDriverId";
export const DRIVER_LOCATION_INTERVAL_MS = 10_000;

type DriverLocationPayload = {
  lat: number;
  lng: number;
  latitude: number;
  longitude: number;
  timestamp: number;
  driverId: string;
};

type LocationSendSource = "background-task" | "initial-fix" | "interval";

let foregroundInterval: ReturnType<typeof setInterval> | null = null;
let lastLocationSendAt = 0;
let sendInFlight = false;

const isWeb = Platform.OS === "web";

function shouldSkipSend(source: LocationSendSource) {
  if (source === "initial-fix") return false;
  const elapsed = Date.now() - lastLocationSendAt;
  return elapsed < DRIVER_LOCATION_INTERVAL_MS - 500;
}

async function sendDriverLocationToFirebase(
  orderId: string,
  driverId: string,
  lat: number,
  lng: number,
) {
  const path = `drivers/${orderId}/locations`;
  const payload: DriverLocationPayload = {
    lat,
    lng,
    latitude: lat,
    longitude: lng,
    timestamp: Date.now(),
    driverId,
  };

  await push(ref(database, path), payload);
  lastLocationSendAt = Date.now();
}

async function pushLocationFromCoords(
  lat: number,
  lng: number,
  source: LocationSendSource,
) {
  if (shouldSkipSend(source)) return;

  const orderId = await AsyncStorage.getItem(ACTIVE_DRIVER_ORDER_KEY);
  const driverId = await AsyncStorage.getItem(ACTIVE_DRIVER_ID_KEY);
  if (!orderId || !driverId) return;

  await sendDriverLocationToFirebase(orderId, driverId, lat, lng);
}

async function getCurrentCoords() {
  const current = await Promise.race([
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }),
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("getCurrentPositionAsync timed out after 15s")),
        15_000,
      );
    }),
  ]);
  return current.coords;
}

async function tickSendCurrentLocation(source: LocationSendSource) {
  if (sendInFlight) return;

  sendInFlight = true;
  try {
    const coords = await getCurrentCoords();
    await pushLocationFromCoords(coords.latitude, coords.longitude, source);
  } catch {
    // best-effort; interval / next tick will retry
  } finally {
    sendInFlight = false;
  }
}

function startForegroundInterval() {
  if (foregroundInterval) return;

  foregroundInterval = setInterval(() => {
    tickSendCurrentLocation("interval").catch(() => {});
  }, DRIVER_LOCATION_INTERVAL_MS);
}

function clearForegroundInterval() {
  if (!foregroundInterval) return;
  clearInterval(foregroundInterval);
  foregroundInterval = null;
}

/** Check current location permission without prompting. */
export async function getDriverLocationPermissionState(): Promise<{
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  canAskForegroundAgain: boolean;
  canAskBackgroundAgain: boolean;
}> {
  if (isWeb) {
    return {
      foregroundGranted: true,
      backgroundGranted: false,
      canAskForegroundAgain: false,
      canAskBackgroundAgain: false,
    };
  }

  const fg = await Location.getForegroundPermissionsAsync();
  const bg = await Location.getBackgroundPermissionsAsync();
  return {
    foregroundGranted: fg.status === "granted",
    backgroundGranted: bg.status === "granted",
    canAskForegroundAgain: fg.status !== "granted" && fg.canAskAgain !== false,
    canAskBackgroundAgain: bg.status !== "granted" && bg.canAskAgain !== false,
  };
}

export async function openDriverLocationSettings() {
  await Linking.openSettings();
}

/**
 * Ask for While Using / foreground location, or open Settings when the OS
 * will no longer show a permission dialog (e.g. Never selected).
 */
export async function requestForegroundDriverLocationPermission(): Promise<{
  granted: boolean;
  openedSettings: boolean;
}> {
  if (isWeb) {
    return { granted: true, openedSettings: false };
  }

  const current = await Location.getForegroundPermissionsAsync();
  if (current.status === "granted") {
    return { granted: true, openedSettings: false };
  }

  if (current.canAskAgain !== false) {
    const requested = await Location.requestForegroundPermissionsAsync();
    if (requested.status === "granted") {
      return { granted: true, openedSettings: false };
    }
    if (requested.canAskAgain !== false) {
      return { granted: false, openedSettings: false };
    }
  }

  await Linking.openSettings();
  return { granted: false, openedSettings: true };
}

/**
 * Ask for Always / background location, or open Settings when the OS
 * will no longer show a permission dialog.
 */
export async function requestAlwaysDriverLocationPermission(): Promise<{
  granted: boolean;
  openedSettings: boolean;
}> {
  if (isWeb) {
    return { granted: false, openedSettings: false };
  }

  const fgResult = await requestForegroundDriverLocationPermission();
  if (!fgResult.granted) {
    return fgResult;
  }

  const bg = await Location.getBackgroundPermissionsAsync();
  if (bg.status === "granted") {
    return { granted: true, openedSettings: false };
  }

  if (bg.canAskAgain !== false) {
    const requested = await Location.requestBackgroundPermissionsAsync();
    if (requested.status === "granted") {
      return { granted: true, openedSettings: false };
    }
    // User kept While Using / dismissed — only open Settings if OS won't ask again.
    if (requested.canAskAgain !== false) {
      return { granted: false, openedSettings: false };
    }
  }

  await Linking.openSettings();
  return { granted: false, openedSettings: true };
}

/** Returns whether background ("Always") location was granted. Does not prompt for Always. */
async function ensureNativePermissions(): Promise<{ backgroundGranted: boolean }> {
  // Prefer get + request only when undetermined so "Never" does not look like a silent crash.
  const existing = await Location.getForegroundPermissionsAsync();
  let fg = existing;
  if (existing.status !== "granted" && existing.canAskAgain !== false) {
    fg = await Location.requestForegroundPermissionsAsync();
  }

  if (fg.status !== "granted") {
    const err = new Error(
      fg.canAskAgain === false
        ? "Location is set to Never. Enable While Using or Always in Settings to share live location."
        : "Location permission is required for live delivery tracking",
    );
    (err as Error & { code?: string }).code = "LOCATION_PERMISSION_DENIED";
    throw err;
  }

  const bg = await Location.getBackgroundPermissionsAsync();
  return { backgroundGranted: bg.status === "granted" };
}

/** Web: foreground geolocation only (no background / TaskManager). */
async function ensureWebPermissions() {
  try {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status === "granted") return;
    if (fg.status === "denied") {
      throw new Error("Location permission is required for live delivery tracking");
    }
  } catch {
    // Some browsers lack navigator.permissions.query — fall through to geolocation prompt.
  }

  try {
    await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch {
    throw new Error(
      "Location permission is required. Allow location access in your browser to share live delivery updates.",
    );
  }
}

async function startNativeBackgroundTracking() {
  const started = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK);
  if (started) {
    await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
  }

  await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: DRIVER_LOCATION_INTERVAL_MS,
    distanceInterval: 0,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Delivery in progress",
      notificationBody: "Sharing your location with the customer",
      notificationColor: "#194B38",
    },
  });
}

async function stopNativeBackgroundTracking() {
  const started = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK);
  if (started) {
    await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
  }
}

export async function startDriverLocationTracking(
  orderId: string,
  driverId: string,
) {
  let backgroundGranted = false;
  if (isWeb) {
    await ensureWebPermissions();
  } else {
    ({ backgroundGranted } = await ensureNativePermissions());
  }

  await AsyncStorage.setItem(ACTIVE_DRIVER_ORDER_KEY, orderId);
  await AsyncStorage.setItem(ACTIVE_DRIVER_ID_KEY, driverId);

  clearForegroundInterval();

  if (!isWeb && backgroundGranted) {
    try {
      await startNativeBackgroundTracking();
    } catch {
      // continue with foreground interval
    }
  } else if (!isWeb) {
    // Ensure any previous background task is stopped if we no longer have Always.
    try {
      await stopNativeBackgroundTracking();
    } catch {
      // ignore
    }
  }

  // Start interval immediately; initial fix is best-effort and must not block startup
  // (getCurrentPositionAsync can hang for a long time on iOS).
  startForegroundInterval();
  tickSendCurrentLocation("initial-fix").catch(() => {});
}

export async function stopDriverLocationTracking() {
  clearForegroundInterval();

  if (!isWeb) {
    await stopNativeBackgroundTracking();
  }

  await AsyncStorage.multiRemove([
    ACTIVE_DRIVER_ORDER_KEY,
    ACTIVE_DRIVER_ID_KEY,
  ]);
  lastLocationSendAt = 0;
}

export async function getActiveDriverOrderId() {
  return AsyncStorage.getItem(ACTIVE_DRIVER_ORDER_KEY);
}

export async function resumeDriverLocationTrackingIfNeeded(driverId: string) {
  const orderId = await getActiveDriverOrderId();
  if (!orderId) return null;

  if (isWeb) {
    await AsyncStorage.setItem(ACTIVE_DRIVER_ID_KEY, driverId);
    startForegroundInterval();
    tickSendCurrentLocation("initial-fix").catch(() => {});
    return orderId;
  }

  const started = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK);
  if (!started) {
    await startDriverLocationTracking(orderId, driverId);
  } else {
    startForegroundInterval();
    tickSendCurrentLocation("initial-fix").catch(() => {});
  }
  return orderId;
}

// Background task registration is native-only; expo-task-manager is unavailable on web.
if (!isWeb) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const TaskManager = require("expo-task-manager") as typeof import("expo-task-manager");

  TaskManager.defineTask(DRIVER_LOCATION_TASK, async ({ data, error }) => {
    if (error) return;

    const locations = (data as { locations?: Location.LocationObject[] })?.locations;
    if (!locations?.length) return;

    const latest = locations[locations.length - 1];

    try {
      await pushLocationFromCoords(
        latest.coords.latitude,
        latest.coords.longitude,
        "background-task",
      );
    } catch {
      // ignore transient firebase/network errors; next tick will retry
    }
  });
}
