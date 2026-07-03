import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { Platform } from "react-native";
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
  const payload: DriverLocationPayload = {
    lat,
    lng,
    latitude: lat,
    longitude: lng,
    timestamp: Date.now(),
    driverId,
  };

  await push(ref(database, `drivers/${orderId}/locations`), payload);
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

async function tickSendCurrentLocation(source: LocationSendSource) {
  if (sendInFlight) return;

  sendInFlight = true;
  try {
    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    await pushLocationFromCoords(
      current.coords.latitude,
      current.coords.longitude,
      source,
    );
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

async function ensureNativePermissions() {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") {
    throw new Error("Location permission is required for live delivery tracking");
  }

  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== "granted") {
    throw new Error("Background location permission is required during delivery");
  }
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

async function startForegroundTrackingLoop() {
  startForegroundInterval();

  try {
    await tickSendCurrentLocation("initial-fix");
  } catch {
    // initial fix is best-effort; interval will retry
  }
}

export async function startDriverLocationTracking(
  orderId: string,
  driverId: string,
) {
  if (isWeb) {
    await ensureWebPermissions();
  } else {
    await ensureNativePermissions();
  }

  await AsyncStorage.setItem(ACTIVE_DRIVER_ORDER_KEY, orderId);
  await AsyncStorage.setItem(ACTIVE_DRIVER_ID_KEY, driverId);

  clearForegroundInterval();

  if (!isWeb) {
    await startNativeBackgroundTracking();
  }

  await startForegroundTrackingLoop();
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
