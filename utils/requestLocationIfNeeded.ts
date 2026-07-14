import { Platform } from "react-native";
import { ensureForegroundLocationPermission } from "@/utils/locationPermission";

/** Best-effort location prompt (e.g. onboarding). Does not throw. */
export async function requestLocationIfNeeded(): Promise<void> {
  if (Platform.OS === "web") return;
  await ensureForegroundLocationPermission();
}
