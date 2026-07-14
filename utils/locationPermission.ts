import { Linking, Platform } from "react-native";
import * as Location from "expo-location";

export type LocationCoords = {
  latitude: number;
  longitude: number;
};

export type LocationPermissionResult =
  | { status: "granted"; canAskAgain: true }
  | { status: "denied"; canAskAgain: boolean }
  | { status: "undetermined"; canAskAgain: true };

export class LocationPermissionError extends Error {
  canAskAgain: boolean;

  constructor(canAskAgain: boolean) {
    super(
      canAskAgain
        ? "Permission to access location was denied"
        : "Location access is off. Enable it in Settings to continue.",
    );
    this.name = "LocationPermissionError";
    this.canAskAgain = canAskAgain;
  }
}

/** Request foreground location only when the OS can still show a system dialog. */
export async function ensureForegroundLocationPermission(): Promise<LocationPermissionResult> {
  if (Platform.OS === "web") {
    return { status: "granted", canAskAgain: true };
  }

  let { status, canAskAgain } = await Location.getForegroundPermissionsAsync();

  if (status === "undetermined" || (status !== "granted" && canAskAgain)) {
    ({ status, canAskAgain } = await Location.requestForegroundPermissionsAsync());
  }

  if (status === "granted") {
    return { status: "granted", canAskAgain: true };
  }

  if (status === "undetermined") {
    return { status: "undetermined", canAskAgain: true };
  }

  return { status: "denied", canAskAgain: !!canAskAgain };
}

export function openAppSettings() {
  return Linking.openSettings();
}

/** Returns device coords after ensuring permission, or null if unavailable. */
export async function getCurrentCoords(): Promise<LocationCoords | null> {
  if (Platform.OS === "web") return null;

  const permission = await ensureForegroundLocationPermission();
  if (permission.status !== "granted") return null;

  try {
    const location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch {
    return null;
  }
}
