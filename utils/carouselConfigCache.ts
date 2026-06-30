import AsyncStorage from "@react-native-async-storage/async-storage";
import { carouselApi } from "@/redux/features/carouselSlice";
import type store from "@/redux/store";
import type { CarouselResponse } from "@/types/global";
import {
  isPromoConfigStale,
  PROMO_CONFIG_TTL_MS,
} from "@/utils/promoConfigCache";

export const CAROUSEL_CONFIG_CACHE_KEY = "@carousel/config";

export type CarouselConfigCache = {
  fetchedAt: number;
  carousel: CarouselResponse;
};

type AppDispatch = typeof store.dispatch;

export function isCarouselConfigStale(
  fetchedAt: number,
  ttlMs = PROMO_CONFIG_TTL_MS,
): boolean {
  return isPromoConfigStale(fetchedAt, ttlMs);
}

export async function readCarouselConfigCache(): Promise<CarouselConfigCache | null> {
  try {
    const raw = await AsyncStorage.getItem(CAROUSEL_CONFIG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CarouselConfigCache;
    if (typeof parsed?.fetchedAt !== "number" || !parsed?.carousel) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function writeCarouselConfigCache(
  carousel: CarouselResponse,
  fetchedAt = Date.now(),
): Promise<void> {
  const payload: CarouselConfigCache = { fetchedAt, carousel };
  await AsyncStorage.setItem(CAROUSEL_CONFIG_CACHE_KEY, JSON.stringify(payload));
}

export function hydrateCarouselConfigCache(
  dispatch: AppDispatch,
  cache: CarouselConfigCache,
): void {
  dispatch(
    carouselApi.util.upsertQueryData(
      "fetchCarousel",
      undefined,
      cache.carousel,
    ),
  );
}

let syncInFlight: Promise<void> | null = null;

export async function syncCarouselConfig(
  dispatch: AppDispatch,
  options?: { force?: boolean },
): Promise<void> {
  if (syncInFlight && !options?.force) {
    return syncInFlight;
  }

  syncInFlight = (async () => {
    const cached = await readCarouselConfigCache();
    if (cached) {
      hydrateCarouselConfigCache(dispatch, cached);
    }

    const shouldFetch =
      options?.force ||
      !cached ||
      isCarouselConfigStale(cached.fetchedAt);

    if (!shouldFetch) return;

    try {
      const carouselResult = await dispatch(
        carouselApi.endpoints.fetchCarousel.initiate(undefined, {
          forceRefetch: true,
        }),
      ).unwrap();

      hydrateCarouselConfigCache(dispatch, {
        fetchedAt: Date.now(),
        carousel: carouselResult,
      });
      await writeCarouselConfigCache(carouselResult);
    } catch {
      // Keep hydrated AsyncStorage data when network fails.
    }
  })().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}
