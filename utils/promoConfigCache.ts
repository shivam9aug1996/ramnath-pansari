import AsyncStorage from "@react-native-async-storage/async-storage";
import { offerApi } from "@/redux/features/offerSlice";
import { deliverySettingsApi } from "@/redux/features/deliverySettingsSlice";
import type store from "@/redux/store";
import type {
  DeliverySettingsResponse,
  OffersResponse,
} from "@/types/global";

export const PROMO_CONFIG_CACHE_KEY = "@promo/config";
export const PROMO_CONFIG_TTL_MS = 60 * 60 * 1000;

export type PromoConfigCache = {
  fetchedAt: number;
  offers: OffersResponse;
  deliverySettings: DeliverySettingsResponse;
};

type AppDispatch = typeof store.dispatch;

export function isPromoConfigStale(
  fetchedAt: number,
  ttlMs = PROMO_CONFIG_TTL_MS,
): boolean {
  return Date.now() - fetchedAt >= ttlMs;
}

export async function readPromoConfigCache(): Promise<PromoConfigCache | null> {
  try {
    const raw = await AsyncStorage.getItem(PROMO_CONFIG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PromoConfigCache;
    if (
      typeof parsed?.fetchedAt !== "number" ||
      !parsed?.offers ||
      !parsed?.deliverySettings
    ) {
      return null;
    }
    return parsed;
  } catch {
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
}

export function hydratePromoConfigCache(
  dispatch: AppDispatch,
  cache: PromoConfigCache,
): void {
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

      hydratePromoConfigCache(dispatch, {
        fetchedAt: Date.now(),
        offers: offersResult,
        deliverySettings: deliveryResult,
      });
      await writePromoConfigCache(offersResult, deliveryResult);
    } catch {
      // Keep hydrated AsyncStorage data when network fails.
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
