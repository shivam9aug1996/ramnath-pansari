import { storage } from "@/utils/storage";
import { StorageKeys } from "@/utils/storageKeys";

export async function getHasSeenOnboarding(): Promise<boolean> {
  const value = await storage.getItem(StorageKeys.hasSeenOnboarding);
  return value === "true";
}

export async function setHasSeenOnboarding(seen = true): Promise<void> {
  await storage.setItem(
    StorageKeys.hasSeenOnboarding,
    seen ? "true" : "false",
  );
}
