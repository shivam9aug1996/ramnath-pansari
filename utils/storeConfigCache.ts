import AsyncStorage from "@react-native-async-storage/async-storage";
import { storeConfigApi } from "@/redux/features/storeConfigSlice";
import type store from "@/redux/store";
import type { StoreConfigResponse } from "@/types/global";
import {
  isPromoConfigStale,
  PROMO_CONFIG_TTL_MS,
} from "@/utils/promoConfigCache";

export const STORE_CONFIG_CACHE_KEY = "@store/config";

export type StoreConfigCache = {
  fetchedAt: number;
  storeConfig: StoreConfigResponse;
};

type AppDispatch = typeof store.dispatch;

export async function readStoreConfigCache(): Promise<StoreConfigCache | null> {
  try {
    const raw = await AsyncStorage.getItem(STORE_CONFIG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoreConfigCache;
    if (typeof parsed?.fetchedAt !== "number" || !parsed?.storeConfig) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function writeStoreConfigCache(
  storeConfig: StoreConfigResponse,
  fetchedAt = Date.now(),
): Promise<void> {
  const payload: StoreConfigCache = { fetchedAt, storeConfig };
  await AsyncStorage.setItem(STORE_CONFIG_CACHE_KEY, JSON.stringify(payload));
}

export function hydrateStoreConfigCache(
  dispatch: AppDispatch,
  cache: StoreConfigCache,
): void {
  dispatch(
    storeConfigApi.util.upsertQueryData(
      "fetchStoreConfig",
      undefined,
      cache.storeConfig,
    ),
  );
}

let syncInFlight: Promise<void> | null = null;

export async function syncStoreConfig(
  dispatch: AppDispatch,
  options?: { force?: boolean },
): Promise<void> {
  if (syncInFlight && !options?.force) {
    return syncInFlight;
  }

  syncInFlight = (async () => {
    const cached = await readStoreConfigCache();
    if (cached) {
      hydrateStoreConfigCache(dispatch, cached);
    }

    const shouldFetch =
      options?.force ||
      !cached ||
      isPromoConfigStale(cached.fetchedAt, PROMO_CONFIG_TTL_MS);

    if (!shouldFetch) return;

    try {
      const storeConfigResult = await dispatch(
        storeConfigApi.endpoints.fetchStoreConfig.initiate(undefined, {
          forceRefetch: true,
        }),
      ).unwrap();

      hydrateStoreConfigCache(dispatch, {
        fetchedAt: Date.now(),
        storeConfig: storeConfigResult,
      });
      await writeStoreConfigCache(storeConfigResult);
    } catch {
      // Keep hydrated AsyncStorage data when network fails.
    }
  })().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

export async function persistStoreConfigCache(
  storeConfig: StoreConfigResponse,
): Promise<void> {
  await writeStoreConfigCache(storeConfig);
}
