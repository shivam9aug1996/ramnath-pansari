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

  constructor(canAskAgain: boolean, message?: string) {
    super(
      message ??
        (canAskAgain
          ? "Permission to access location was denied"
          : Platform.OS === "web"
            ? "Location is blocked for this site. Click the lock icon in the address bar → Site settings → Location → Allow, then tap Try Again."
            : "Location access is off. Enable it in Settings to continue."),
    );
    this.name = "LocationPermissionError";
    this.canAskAgain = canAskAgain;
  }
}

async function queryWebGeolocationPermission(): Promise<
  PermissionState | "unsupported"
> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return "unsupported";
  }
  try {
    const result = await navigator.permissions.query({
      name: "geolocation" as PermissionName,
    });
    return result.state;
  } catch {
    return "unsupported";
  }
}

/** Request foreground location only when the OS/browser can still show a system dialog. */
export async function ensureForegroundLocationPermission(): Promise<LocationPermissionResult> {
  if (Platform.OS === "web") {
    const webState = await queryWebGeolocationPermission();

    // Already granted — no prompt needed.
    if (webState === "granted") {
      return { status: "granted", canAskAgain: true };
    }

    // Permanently blocked — browser will not show the prompt again.
    if (webState === "denied") {
      return { status: "denied", canAskAgain: false };
    }

    // "prompt" / unsupported — ask via expo-location (triggers browser dialog).
    try {
      const requested = await Location.requestForegroundPermissionsAsync();
      if (requested.status === "granted") {
        return { status: "granted", canAskAgain: true };
      }
      // After dismiss/deny, Permissions API often reports denied → cannot re-prompt.
      const after = await queryWebGeolocationPermission();
      return {
        status: "denied",
        canAskAgain: after === "prompt" || after === "unsupported",
      };
    } catch {
      // Fall through: getCurrentPositionAsync will trigger the prompt on some browsers.
      return { status: "granted", canAskAgain: true };
    }
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
  if (Platform.OS === "web") {
    // Browsers don't expose a deep link into site location settings.
    return Promise.resolve();
  }
  return Linking.openSettings();
}

/** Returns device coords after ensuring permission, or null if unavailable. */
export async function getCurrentCoords(): Promise<LocationCoords | null> {
  if (Platform.OS === "web") {
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
