import AsyncStorage from "@react-native-async-storage/async-storage";
import { storeConfigApi } from "@/redux/features/storeConfigSlice";
import type store from "@/redux/store";
import type { StoreConfigResponse } from "@/types/global";
import { devLog, devWarn } from "@/utils/devLog";
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

function isValidStoreConfigResponse(
  value: unknown,
): value is StoreConfigResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "storeConfig" in value &&
    typeof (value as StoreConfigResponse).storeConfig === "object" &&
    (value as StoreConfigResponse).storeConfig !== null
  );
}

export async function readStoreConfigCache(): Promise<StoreConfigCache | null> {
  try {
    const raw = await AsyncStorage.getItem(STORE_CONFIG_CACHE_KEY);
    if (!raw) {
      devLog("[store-config] readCache", { hit: false });
      return null;
    }
    const parsed = JSON.parse(raw) as StoreConfigCache;
    if (
      typeof parsed?.fetchedAt !== "number" ||
      !isValidStoreConfigResponse(parsed?.storeConfig)
    ) {
      devWarn("[store-config] readCache invalid shape", {
        fetchedAt: parsed?.fetchedAt,
        hasStoreConfig: Boolean(parsed?.storeConfig),
      });
      return null;
    }
    devLog("[store-config] readCache", {
      hit: true,
      fetchedAt: parsed.fetchedAt,
      ageMs: Date.now() - parsed.fetchedAt,
    });
    return parsed;
  } catch (error) {
    devWarn("[store-config] readCache error", error);
    return null;
  }
}

export async function writeStoreConfigCache(
  storeConfig: StoreConfigResponse,
  fetchedAt = Date.now(),
): Promise<void> {
  if (!isValidStoreConfigResponse(storeConfig)) {
    devWarn("[store-config] writeCache skipped — invalid", storeConfig);
    return;
  }
  const payload: StoreConfigCache = { fetchedAt, storeConfig };
  await AsyncStorage.setItem(STORE_CONFIG_CACHE_KEY, JSON.stringify(payload));
  devLog("[store-config] writeCache", { fetchedAt });
}

/**
 * Must be awaited before a forceRefetch initiate — same race as recentSearch.
 * Never upsert `undefined` (RTK forceQueryFn returns `{ data: undefined }` and logs
 * a misleading "`baseQuery` returned neither error nor result" error).
 */
export async function hydrateStoreConfigCache(
  dispatch: AppDispatch,
  cache: StoreConfigCache,
): Promise<void> {
  if (!isValidStoreConfigResponse(cache?.storeConfig)) {
    devWarn("[store-config] hydrate skipped — invalid", {
      hasCache: Boolean(cache),
      value: cache?.storeConfig,
    });
    return;
  }
  devLog("[store-config] hydrate start", { fetchedAt: cache.fetchedAt });
  await dispatch(
    storeConfigApi.util.upsertQueryData(
      "fetchStoreConfig",
      undefined,
      cache.storeConfig,
    ),
  );
  devLog("[store-config] hydrate done", { fetchedAt: cache.fetchedAt });
}

let syncInFlight: Promise<void> | null = null;

export async function syncStoreConfig(
  dispatch: AppDispatch,
  options?: { force?: boolean },
): Promise<void> {
  if (syncInFlight && !options?.force) {
    devLog("[store-config] syncStoreConfig join in-flight");
    return syncInFlight;
  }

  syncInFlight = (async () => {
    devLog("[store-config] syncStoreConfig start", { force: Boolean(options?.force) });
    const cached = await readStoreConfigCache();
    if (cached) {
      await hydrateStoreConfigCache(dispatch, cached);
    }

    const shouldFetch =
      options?.force ||
      !cached ||
      isPromoConfigStale(cached.fetchedAt, PROMO_CONFIG_TTL_MS);

    devLog("[store-config] syncStoreConfig shouldFetch", {
      shouldFetch,
      force: Boolean(options?.force),
      hasCached: Boolean(cached),
      stale: cached
        ? isPromoConfigStale(cached.fetchedAt, PROMO_CONFIG_TTL_MS)
        : null,
    });

    if (!shouldFetch) return;

    try {
      devLog("[store-config] network initiate forceRefetch");
      const storeConfigResult = await dispatch(
        storeConfigApi.endpoints.fetchStoreConfig.initiate(undefined, {
          forceRefetch: true,
        }),
      ).unwrap();

      if (!isValidStoreConfigResponse(storeConfigResult)) {
        devWarn("[store-config] network result invalid", storeConfigResult);
        return;
      }

      await hydrateStoreConfigCache(dispatch, {
        fetchedAt: Date.now(),
        storeConfig: storeConfigResult,
      });
      await writeStoreConfigCache(storeConfigResult);
      devLog("[store-config] syncStoreConfig network ok");
    } catch (error) {
      // Keep hydrated AsyncStorage data when network fails.
      devWarn("[store-config] syncStoreConfig network failed", error);
    }
  })().finally(() => {
    syncInFlight = null;
    devLog("[store-config] syncStoreConfig end");
  });

  return syncInFlight;
}

export async function persistStoreConfigCache(
  storeConfig: StoreConfigResponse,
): Promise<void> {
  await writeStoreConfigCache(storeConfig);
}
