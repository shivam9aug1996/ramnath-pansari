import * as Location from "expo-location";
import { LatLng } from "react-native-maps";

export const getLatLng = (
  locationData: Location.LocationObject
): {
  latitude: number;
  longitude: number;
} => {
  const { latitude, longitude } = locationData.coords;
  return { latitude, longitude };
};

export const fetchLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      throw Error("Permission to access location was denied");
    }
    const location: Location.LocationObject =
      await Location.getCurrentPositionAsync({});

    const { latitude, longitude } = getLatLng(location);
    return {
      latitude,
      longitude,
    };
  } catch (error: any) {
    throw Error(error?.message || "Error while fetching lat and long");
  }
};

/**
 * Calculates the distance in kilometers between two geographical points
 * using the Haversine formula.
 *
 * @param {LatLng} point1 - The first point (latitude and longitude).
 * @param {LatLng} point2 - The second point (latitude and longitude).
 * @returns {number} - The distance in kilometers.
 */
const getDistanceFromLatLngInKm = (point1: LatLng, point2: LatLng): number => {
  const R = 6371; // Earth's radius in km
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(point2.latitude - point1.latitude);
  const dLng = toRad(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
      Math.cos(toRad(point2.latitude)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const isWithinDeliveryRadius = (selectedLocation: LatLng): any => {
  const deliveryCenter: LatLng = { latitude: 28.713074, longitude: 77.65419 };
  const distance = getDistanceFromLatLngInKm(deliveryCenter, selectedLocation);

  console.log(`Distance from delivery center: ${distance} km`);
  return { isWithin: distance <= 5, distance: distance };
};

export default isWithinDeliveryRadius;
