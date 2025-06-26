import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";

const LOCATION_CACHE_KEY = "LOCATION_CACHE";
const CACHE_DURATION = 30 * 60 * 1000;

function getLatLng(location: Location.LocationObject) {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

export const fetchLocation = async () => {
  try {
    const now = Date.now();

    // Check SecureStore for cached location
    const cached = await SecureStore.getItemAsync(LOCATION_CACHE_KEY);
    if (cached) {
      const { timestamp, latitude, longitude } = JSON.parse(cached);
      const age = now - timestamp;

      //console.log("📦 Cached location age:", age, "ms");

      if (age < CACHE_DURATION) {
        //console.log("✅ Using cached location");
        return { latitude, longitude };
      }

      //console.log("⏰ Location cache expired, fetching new");
    } else {
      //console.log("❌ No cached location found");
    }

    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Permission to access location was denied");
    }

    // Get current location
    const location: Location.LocationObject =
      await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = getLatLng(location);

    // Cache new location
    await SecureStore.setItemAsync(
      LOCATION_CACHE_KEY,
      JSON.stringify({
        timestamp: now,
        latitude,
        longitude,
      })
    );

    //console.log("📍 New location fetched and cached");
    return { latitude, longitude };
  } catch (error: any) {
    console.error("❌ Location fetch error:", error);
    throw new Error(error?.message || "Error while fetching lat and long");
  }
};
