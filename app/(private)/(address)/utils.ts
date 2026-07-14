import * as Location from "expo-location";
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
    throw Error(error?.message || "Error while fetching lat and long");
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
