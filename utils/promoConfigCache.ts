import AsyncStorage from "@react-native-async-storage/async-storage";
import { offerApi } from "@/redux/features/offerSlice";
import { deliverySettingsApi } from "@/redux/features/deliverySettingsSlice";
import type store from "@/redux/store";
import type {
  DeliverySettingsResponse,
  OffersResponse,
} from "@/types/global";
import { devLog } from "@/utils/devLog";

export const PROMO_CONFIG_CACHE_KEY = "@promo/config";
export const PROMO_CONFIG_TTL_MS = 60 * 60 * 1000;

export type PromoConfigCache = {
  fetchedAt: number;
  offers: OffersResponse;
  deliverySettings: DeliverySettingsResponse;
};

type AppDispatch = typeof store.dispatch;

export function summarizeOffers(offers?: OffersResponse | null) {
  const list = offers?.offers ?? [];
  return {
    count: list.length,
    enabledCount: list.filter((o) => o.enabled).length,
    ids: list.map((o) => o.id),
    enabled: list.map((o) => ({
      id: o.id,
      enabled: o.enabled,
      type: o.type,
      minOrderValue: o.minOrderValue,
    })),
  };
}

export function isPromoConfigStale(
  fetchedAt: number,
  ttlMs = PROMO_CONFIG_TTL_MS,
): boolean {
  return Date.now() - fetchedAt >= ttlMs;
}

export async function readPromoConfigCache(): Promise<PromoConfigCache | null> {
  try {
    const raw = await AsyncStorage.getItem(PROMO_CONFIG_CACHE_KEY);
    if (!raw) {
      devLog("[offers] readCache miss");
      return null;
    }
    const parsed = JSON.parse(raw) as PromoConfigCache;
    if (
      typeof parsed?.fetchedAt !== "number" ||
      !parsed?.offers ||
      !parsed?.deliverySettings
    ) {
      devLog("[offers] readCache invalid shape");
      return null;
    }
    devLog("[offers] readCache hit", {
      fetchedAt: parsed.fetchedAt,
      ageMs: Date.now() - parsed.fetchedAt,
      stale: isPromoConfigStale(parsed.fetchedAt),
      ...summarizeOffers(parsed.offers),
    });
    return parsed;
  } catch {
    devLog("[offers] readCache parse error");
    return null;
  }
}

export async function writePromoConfigCache(
  offers: OffersResponse,
  deliverySettings: DeliverySettingsResponse,
  fetchedAt = Date.now(),
): Promise<void> {
  const payload: PromoConfigCache = {
    fetchedAt,
    offers,
    deliverySettings,
  };
  await AsyncStorage.setItem(PROMO_CONFIG_CACHE_KEY, JSON.stringify(payload));
  devLog("[offers] writeCache", {
    fetchedAt,
    ...summarizeOffers(offers),
  });
}

export function hydratePromoConfigCache(
  dispatch: AppDispatch,
  cache: PromoConfigCache,
): void {
  devLog("[offers] hydrate", {
    fetchedAt: cache.fetchedAt,
    ageMs: Date.now() - cache.fetchedAt,
    ...summarizeOffers(cache.offers),
  });
  dispatch(
    offerApi.util.upsertQueryData("fetchOffers", undefined, cache.offers),
  );
  dispatch(
    deliverySettingsApi.util.upsertQueryData(
      "fetchDeliverySettings",
      undefined,
      cache.deliverySettings,
    ),
  );
}

let syncInFlight: Promise<void> | null = null;

export async function syncPromoConfig(
  dispatch: AppDispatch,
  options?: { force?: boolean },
): Promise<void> {
  if (syncInFlight && !options?.force) {
    return syncInFlight;
  }

  syncInFlight = (async () => {
    const cached = await readPromoConfigCache();
    if (cached) {
      hydratePromoConfigCache(dispatch, cached);
    }

    const shouldFetch =
      options?.force ||
      !cached ||
      isPromoConfigStale(cached.fetchedAt);

    devLog("[offers] syncPromoConfig", {
      force: Boolean(options?.force),
      hasCache: Boolean(cached),
      shouldFetch,
      ...summarizeOffers(cached?.offers),
    });

    if (!shouldFetch) return;

    try {
      const [offersResult, deliveryResult] = await Promise.all([
        dispatch(
          offerApi.endpoints.fetchOffers.initiate(undefined, {
            forceRefetch: true,
          }),
        ).unwrap(),
        dispatch(
          deliverySettingsApi.endpoints.fetchDeliverySettings.initiate(
            undefined,
            { forceRefetch: true },
          ),
        ).unwrap(),
      ]);

      devLog("[offers] syncPromoConfig network", summarizeOffers(offersResult));

      hydratePromoConfigCache(dispatch, {
        fetchedAt: Date.now(),
        offers: offersResult,
        deliverySettings: deliveryResult,
      });
      await writePromoConfigCache(offersResult, deliveryResult);
    } catch {
      // Keep hydrated AsyncStorage data when network fails.
      devLog("[offers] syncPromoConfig network failed");
    }
  })().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

export async function persistPromoConfigCache(
  offers: OffersResponse,
  deliverySettings: DeliverySettingsResponse,
): Promise<void> {
  await writePromoConfigCache(offers, deliverySettings);
}
