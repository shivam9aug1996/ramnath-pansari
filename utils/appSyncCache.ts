import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  AppSyncClientVersions,
  AppSyncFetchFlags,
  AppSyncServerVersions,
} from "@/types/global";

export const APP_SYNC_VERSIONS_KEY = "@app/sync-versions";

export function shouldFetchByVersion(
  clientVersion: number | undefined,
  serverVersion: number,
): boolean {
  if (clientVersion == null || Number.isNaN(clientVersion)) {
    return true;
  }
  return clientVersion < serverVersion;
}

export async function readAppSyncClientVersions(): Promise<AppSyncClientVersions> {
  try {
    const raw = await AsyncStorage.getItem(APP_SYNC_VERSIONS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as AppSyncClientVersions;
  } catch {
    return {};
  }
}

export async function writeAppSyncClientVersions(
  versions: AppSyncClientVersions,
): Promise<void> {
  await AsyncStorage.setItem(APP_SYNC_VERSIONS_KEY, JSON.stringify(versions));
}

export function buildUpdatedClientVersions(
  server: AppSyncServerVersions,
): AppSyncClientVersions {
  return {
    carousel: server.carousel,
    offers: server.offers,
    deliverySettings: server.deliverySettings,
    storeConfig: server.storeConfig,
    category: server.category,
    product: server.product,
  };
}
