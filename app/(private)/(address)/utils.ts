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
