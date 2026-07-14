import AsyncStorage from "@react-native-async-storage/async-storage";
import { recentSearchApi } from "@/redux/features/recentSearchSlice";
import type store from "@/redux/store";
import {
  recentSearchLog,
  runRecentSearchCacheHydration,
} from "@/utils/recentSearchDebug";

export const RECENT_SEARCH_CACHE_KEY = "@recentSearch/config";
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

export async function readRecentSearchCache(
  userId: string,
): Promise<RecentSearchCache | null> {
  try {
    const raw = await AsyncStorage.getItem(getRecentSearchCacheKey(userId));
    if (!raw) {
      recentSearchLog("disk:miss", { userId });
      return null;
    }
    const parsed = JSON.parse(raw) as RecentSearchCache;
    if (!Array.isArray(parsed?.data) || parsed.userId !== userId) {
      recentSearchLog("disk:invalid", { userId });
      return null;
    }
    recentSearchLog("disk:hit", { userId, count: parsed.data.length });
    return parsed;
  } catch (error) {
    recentSearchLog("disk:read-error", error);
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
  recentSearchLog("disk:write", { userId, count: data.length });
}

export async function upsertRecentSearchInStore(
  dispatch: AppDispatch,
  userId: string,
  data: RecentSearchItem[],
): Promise<void> {
  recentSearchLog("rtk:upsert", { userId, count: data.length });
  // Must await — upsertQueryData leaves status "pending" until the microtask
  // fulfills. A follow-up initiate({ forceRefetch: true }) while pending is
  // skipped by RTK (no HTTP), even with forceRefetch.
  await runRecentSearchCacheHydration(() =>
    dispatch(
      recentSearchApi.util.upsertQueryData(
        "fetchRecentSearch",
        { userId },
        data,
      ),
    ),
  );
}

function createLocalRecentSearchId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Guest: save search locally only. */
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

  recentSearchLog("local:save", { userId, query: trimmed, count: next.length });
  await upsertRecentSearchInStore(dispatch, userId, next);
  await writeRecentSearchCache(userId, next);
  return next;
}

/** Guest: remove search locally only. */
export async function removeLocalRecentSearchItem(
  dispatch: AppDispatch,
  userId: string,
  id: string,
): Promise<RecentSearchItem[]> {
  if (!userId) return [];

  const cached = await readRecentSearchCache(userId);
  const next = (cached?.data ?? []).filter((item) => item._id !== id);
  recentSearchLog("local:remove", { userId, id, count: next.length });
  await upsertRecentSearchInStore(dispatch, userId, next);
  await writeRecentSearchCache(userId, next);
  return next;
}

/**
 * Load recent search for the current user.
 * - Guests: disk only
 * - Logged-in: disk first (instant), then GET /recentSearch and persist
 */
export async function loadRecentSearch(
  dispatch: AppDispatch,
  userId: string,
  options?: { isGuestUser?: boolean },
): Promise<void> {
  recentSearchLog("load:start", {
    userId,
    isGuestUser: Boolean(options?.isGuestUser),
  });

  if (!userId) {
    recentSearchLog("load:skip-no-user");
    return;
  }

  const cached = await readRecentSearchCache(userId);
  if (cached) {
    await upsertRecentSearchInStore(dispatch, userId, cached.data);
  } else {
    recentSearchLog("load:no-disk-cache", { userId });
  }

  if (options?.isGuestUser) {
    recentSearchLog("load:guest-exit", {
      userId,
      count: cached?.data.length ?? 0,
    });
    return;
  }

  try {
    recentSearchLog("load:api:start", { userId });
    const data = (await dispatch(
      recentSearchApi.endpoints.fetchRecentSearch.initiate(
        { userId },
        { subscribe: false, forceRefetch: true },
      ),
    ).unwrap()) as RecentSearchItem[];

    const list = Array.isArray(data) ? data : [];
    recentSearchLog("load:api:ok", { userId, count: list.length });
    await upsertRecentSearchInStore(dispatch, userId, list);
    await writeRecentSearchCache(userId, list);
    recentSearchLog("load:done", { userId, count: list.length });
  } catch (error) {
    recentSearchLog("load:api:fail", { userId, error });
  }
}
