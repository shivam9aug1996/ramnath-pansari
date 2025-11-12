import * as Location from "expo-location";

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


const getDistanceFromLatLngInKm = (point1: any, point2: any): number => {
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

function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const isWithinDeliveryRadius = (selectedLocation: any): any => {
  console.log("selectedLocation",selectedLocation)
  const deliveryCenter: any = { latitude: 28.713074, longitude: 77.65419 };
  const distance = getDistanceInKm(deliveryCenter.latitude, deliveryCenter.longitude, selectedLocation.latitude, selectedLocation.longitude);

  return { isWithin: distance <= 3, distance: distance.toFixed(1) };
};

export default isWithinDeliveryRadius;
