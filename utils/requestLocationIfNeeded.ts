import { Platform } from "react-native";
import * as Location from "expo-location";

export async function requestLocationIfNeeded(): Promise<void> {
  if (Platform.OS === "web") return;

  const existing = await Location.getForegroundPermissionsAsync();
  if (existing.status !== "granted") {
    await Location.requestForegroundPermissionsAsync();
  }
}