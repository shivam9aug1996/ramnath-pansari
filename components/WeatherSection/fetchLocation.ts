import { storage } from "@/utils/storage";
import { StorageKeys } from "@/utils/storageKeys";
import * as Location from "expo-location";

const CACHE_DURATION = 30 * 60 * 1000;

type CachedLocation = {
  timestamp: number;
  latitude: number;
  longitude: number;
};

function getLatLng(location: Location.LocationObject) {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

async function readLocationCache(): Promise<CachedLocation | null> {
  const raw = await storage.getItem(StorageKeys.locationCache);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedLocation;
    if (
      typeof parsed?.timestamp !== "number" ||
      typeof parsed?.latitude !== "number" ||
      typeof parsed?.longitude !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function writeLocationCache(
  timestamp: number,
  latitude: number,
  longitude: number,
): Promise<void> {
  await storage.setItem(
    StorageKeys.locationCache,
    JSON.stringify({ timestamp, latitude, longitude }),
  );
}

/** Returns coords, stale cache, or null when location is unavailable. */
export const fetchLocation = async (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  const now = Date.now();
  const cached = await readLocationCache();

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return { latitude: cached.latitude, longitude: cached.longitude };
  }

  let permission = await Location.getForegroundPermissionsAsync();
  if (permission.status === "undetermined") {
    permission = await Location.requestForegroundPermissionsAsync();
  }

  if (permission.status !== "granted") {
    if (cached) {
      return { latitude: cached.latitude, longitude: cached.longitude };
    }
    return null;
  }

  try {
    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = getLatLng(location);
    await writeLocationCache(now, latitude, longitude);
    return { latitude, longitude };
  } catch {
    if (cached) {
      return { latitude: cached.latitude, longitude: cached.longitude };
    }
    return null;
  }
};
