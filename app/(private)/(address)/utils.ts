import * as Location from "expo-location";
import { Platform } from "react-native";
import {
  checkDeliveryRadius,
  resolveDeliveryRadius,
  type DeliveryRadiusSettings,
} from "@/utils/storeConfig";
import { DEFAULT_DELIVERY_RADIUS } from "@/constants/StoreConfig";
import {
  ensureForegroundLocationPermission,
  LocationPermissionError,
} from "@/utils/locationPermission";

export const getLatLng = (
  locationData: Location.LocationObject,
): {
  latitude: number;
  longitude: number;
} => {
  const { latitude, longitude } = locationData.coords;
  return { latitude, longitude };
};

function isGeolocationDeniedMessage(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("denied") ||
    lower.includes("permission") ||
    lower.includes("secure origins") ||
    lower.includes("only secure origins")
  );
}

export const fetchLocation = async () => {
  const permission = await ensureForegroundLocationPermission();
  if (permission.status !== "granted") {
    throw new LocationPermissionError(permission.canAskAgain);
  }

  try {
    const location: Location.LocationObject =
      await Location.getCurrentPositionAsync({});
    return getLatLng(location);
  } catch (error: any) {
    const message = String(error?.message || "");
    if (isGeolocationDeniedMessage(message)) {
      throw new LocationPermissionError(
        false,
        Platform.OS === "web"
          ? "Location is blocked for this site. Click the lock icon in the address bar → Site settings → Location → Allow, then tap Try Again."
          : undefined,
      );
    }
    throw Error(message || "Error while fetching lat and long");
  }
};

export function isWithinDeliveryRadius(
  selectedLocation: { latitude: number; longitude: number },
  deliveryRadius?: Partial<DeliveryRadiusSettings> | null,
) {
  return checkDeliveryRadius(
    selectedLocation,
    resolveDeliveryRadius(deliveryRadius ?? DEFAULT_DELIVERY_RADIUS),
  );
}

export default isWithinDeliveryRadius;
