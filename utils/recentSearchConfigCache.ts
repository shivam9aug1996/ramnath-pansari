import AsyncStorage from "@react-native-async-storage/async-storage";
import { recentSearchApi } from "@/redux/features/recentSearchSlice";
import type store from "@/redux/store";
import { PROMO_CONFIG_TTL_MS, isPromoConfigStale } from "@/utils/promoConfigCache";
import { devError } from "@/utils/devLog";
import { runRecentSearchCacheHydration } from "@/utils/recentSearchDebug";

export const RECENT_SEARCH_CACHE_KEY = "@recentSearch/config";
export const RECENT_SEARCH_TTL_MS = PROMO_CONFIG_TTL_MS;
const MAX_LOCAL_RECENT_SEARCH = 10;

export type RecentSearchItem = {
  _id: string;
  query: string;
  timestamp: string;
};

export type RecentSearchCache = {
  fetchedAt: number;
  userId: string;
  data: RecentSearchItem[];
};

type AppDispatch = typeof store.dispatch;

export function getRecentSearchCacheKey(userId: string): string {
  return `${RECENT_SEARCH_CACHE_KEY}:${userId}`;
}

export function isRecentSearchStale(
  fetchedAt: number,
  ttlMs = RECENT_SEARCH_TTL_MS,
): boolean {
  return isPromoConfigStale(fetchedAt, ttlMs);
}

export async function readRecentSearchCache(
  userId: string,
): Promise<RecentSearchCache | null> {
  try {
    const raw = await AsyncStorage.getItem(getRecentSearchCacheKey(userId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as RecentSearchCache;
    if (!Array.isArray(parsed?.data) || parsed.userId !== userId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function writeRecentSearchCache(
  userId: string,
  data: RecentSearchItem[],
  fetchedAt = Date.now(),
): Promise<void> {
  const payload: RecentSearchCache = { fetchedAt, userId, data };
  await AsyncStorage.setItem(
    getRecentSearchCacheKey(userId),
    JSON.stringify(payload),
  );
}

export function upsertRecentSearchInStore(
  dispatch: AppDispatch,
  userId: string,
  data: RecentSearchItem[],
): void {
  runRecentSearchCacheHydration(() => {
    dispatch(
      recentSearchApi.util.upsertQueryData(
        "fetchRecentSearch",
        { userId },
        data,
      ),
    );
  });
}

function createLocalRecentSearchId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Guest mode: persist a search locally without API calls. */
export async function saveLocalRecentSearchItem(
  dispatch: AppDispatch,
  userId: string,
  query: string,
): Promise<RecentSearchItem[]> {
  const trimmed = query.trim();
  if (!trimmed || !userId) return [];

  const cached = await readRecentSearchCache(userId);
  const existing = cached?.data ?? [];
  const withoutDuplicate = existing.filter(
    (item) => item.query.toLowerCase() !== trimmed.toLowerCase(),
  );
  const next: RecentSearchItem[] = [
    {
      _id: createLocalRecentSearchId(),
      query: trimmed,
      timestamp: new Date().toISOString(),
    },
    ...withoutDuplicate,
  ].slice(0, MAX_LOCAL_RECENT_SEARCH);

  upsertRecentSearchInStore(dispatch, userId, next);
  await writeRecentSearchCache(userId, next);
  return next;
}

/** Guest mode: remove a search locally without API calls. */
export async function removeLocalRecentSearchItem(
  dispatch: AppDispatch,
  userId: string,
  id: string,
): Promise<RecentSearchItem[]> {
  if (!userId) return [];

  const cached = await readRecentSearchCache(userId);
  const next = (cached?.data ?? []).filter((item) => item._id !== id);
  upsertRecentSearchInStore(dispatch, userId, next);
  await writeRecentSearchCache(userId, next);
  return next;
}

export function hydrateRecentSearchCache(
  dispatch: AppDispatch,
  cache: RecentSearchCache,
): void {
  runRecentSearchCacheHydration(() => {
    dispatch(
      recentSearchApi.util.upsertQueryData(
        "fetchRecentSearch",
        { userId: cache.userId },
        cache.data,
      ),
    );
  });
}

let syncInFlight: Promise<void> | null = null;

async function resolveRecentSearchCache(
  userId: string,
  prefetchedCache?: RecentSearchCache | null,
): Promise<RecentSearchCache | null> {
  if (prefetchedCache) {
    return prefetchedCache;
  }
  return readRecentSearchCache(userId);
}

/** Read disk cache and hydrate RTK. Returns cache even when disk is empty. */
export async function hydrateRecentSearchFromStorage(
  dispatch: AppDispatch,
  userId: string,
  prefetchedCache?: RecentSearchCache | null,
): Promise<RecentSearchCache | null> {
  if (!userId) {
    return null;
  }

  const cached = await resolveRecentSearchCache(userId, prefetchedCache);
  if (cached) {
    hydrateRecentSearchCache(dispatch, cached);
  }
  return cached;
}

/** Read AsyncStorage and hydrate RTK immediately. No network fetch. */
export async function prefetchRecentSearchFromStorage(
  dispatch: AppDispatch,
  userId: string,
): Promise<RecentSearchCache | null> {
  return hydrateRecentSearchFromStorage(dispatch, userId);
}

export async function syncRecentSearch(
  dispatch: AppDispatch,
  userId: string,
  options?: {
    force?: boolean;
    prefetchedCache?: RecentSearchCache | null;
    localOnly?: boolean;
  },
): Promise<void> {
  if (!userId) {
    return;
  }

  if (syncInFlight && !options?.force) {
    return syncInFlight;
  }

  syncInFlight = (async () => {
    const cached = await hydrateRecentSearchFromStorage(
      dispatch,
      userId,
      options?.prefetchedCache,
    );

    if (options?.localOnly) {
      return;
    }

    const shouldFetch =
      options?.force ||
      !cached ||
      isRecentSearchStale(cached.fetchedAt);

    if (!shouldFetch) {
      return;
    }

    try {
      const data = (await dispatch(
        recentSearchApi.endpoints.fetchRecentSearch.initiate(
          { userId },
          { forceRefetch: true },
        ),
      ).unwrap()) as RecentSearchItem[];

      if (Array.isArray(data) && data.length > 0) {
        upsertRecentSearchInStore(dispatch, userId, data);
        await writeRecentSearchCache(userId, data);
        return;
      }

      // RTK stores [] from the response — restore disk cache when API is empty.
      const fallback = cached ?? (await readRecentSearchCache(userId));
      if (fallback) {
        hydrateRecentSearchCache(dispatch, fallback);
      }
    } catch {
      devError("Failed to sync recent search");
      const fallback = cached ?? (await readRecentSearchCache(userId));
      if (fallback) {
        hydrateRecentSearchCache(dispatch, fallback);
      }
    }
  })().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}
