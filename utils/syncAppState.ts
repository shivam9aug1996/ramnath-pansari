import { baseUrl } from "@/redux/constants";
import { offerApi } from "@/redux/features/offerSlice";
import { deliverySettingsApi } from "@/redux/features/deliverySettingsSlice";
import { carouselApi } from "@/redux/features/carouselSlice";
import { storeConfigApi } from "@/redux/features/storeConfigSlice";
import { categoryApi } from "@/redux/features/categorySlice";
import {
  setSyncComplete,
  setSyncStarted,
} from "@/redux/features/appSyncSlice";
import type store from "@/redux/store";
import type {
  AppSyncClientVersions,
  AppSyncFetchFlags,
  AppSyncResponse,
} from "@/types/global";
import {
  readAppSyncClientVersions,
  writeAppSyncClientVersions,
  buildUpdatedClientVersions,
} from "@/utils/appSyncCache";
import {
  hydratePromoConfigCache,
  readPromoConfigCache,
  writePromoConfigCache,
} from "@/utils/promoConfigCache";
import {
  hydrateCarouselConfigCache,
  isBadCarouselCache,
  readCarouselConfigCache,
  writeCarouselConfigCache,
} from "@/utils/carouselConfigCache";
import {
  hydrateStoreConfigCache,
  readStoreConfigCache,
  writeStoreConfigCache,
} from "@/utils/storeConfigCache";
import {
  hydrateCategoryConfigCache,
  isBadCategoryCache,
  isCategoryConfigStale,
  readCategoryConfigCache,
  writeCategoryConfigCache,
} from "@/utils/categoryConfigCache";
import { categoryLog } from "@/utils/categoryDebug";
import {
  prefetchRecentSearchFromStorage,
  syncRecentSearch,
} from "@/utils/recentSearchConfigCache";

type AppDispatch = typeof store.dispatch;

export type SyncAppStateOptions = {
  token?: string | null;
  userId?: string;
  isGuestUser?: boolean;
};

let syncInFlight: Promise<void> | null = null;

function syncLog(label: string, data?: unknown): void {
  if (!__DEV__) return;
  if (data !== undefined) {
    console.log(`[app-sync] ${label}`, data);
  } else {
    console.log(`[app-sync] ${label}`);
  }
}

async function runFetchTask(
  name: string,
  task: () => Promise<void>,
): Promise<void> {
  syncLog(`fetch:${name}:start`);
  try {
    await task();
    syncLog(`fetch:${name}:ok`);
  } catch (error) {
    syncLog(`fetch:${name}:fail`, error);
    throw error;
  }
}

async function postSyncState(
  client: AppSyncClientVersions,
  token?: string | null,
): Promise<AppSyncResponse> {
  syncLog("sync-state:request", { client, hasToken: Boolean(token) });

  const response = await fetch(`${baseUrl}/app/sync-state`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({ client }),
  });

  if (!response.ok) {
    throw new Error(`sync-state failed (${response.status})`);
  }

  const body = (await response.json()) as AppSyncResponse;
  syncLog("sync-state:response", body);
  return body;
}

async function hydrateLocalCaches(
  dispatch: AppDispatch,
  userId?: string,
): Promise<void> {
  const [promoCache, carouselCache, storeCache, categoryCache] =
    await Promise.all([
      readPromoConfigCache(),
      readCarouselConfigCache(),
      readStoreConfigCache(),
      readCategoryConfigCache(),
    ]);

  syncLog("cache:promo", promoCache ? "hit" : "miss");
  syncLog("cache:carousel", carouselCache ? "hit" : "miss");
  syncLog("cache:store", storeCache ? "hit" : "miss");
  syncLog("cache:category", categoryCache ? "hit" : "miss");

  if (promoCache) hydratePromoConfigCache(dispatch, promoCache);
  if (carouselCache) hydrateCarouselConfigCache(dispatch, carouselCache);
  if (storeCache) hydrateStoreConfigCache(dispatch, storeCache);
  if (categoryCache) hydrateCategoryConfigCache(dispatch, categoryCache);
}

function filterFetchForGuest(fetch: AppSyncFetchFlags): AppSyncFetchFlags {
  return {
    carousel: fetch.carousel,
    offers: false,
    deliverySettings: false,
    storeConfig: false,
    category: fetch.category,
  };
}

async function resolveCarouselFetch(
  fetch: AppSyncFetchFlags,
): Promise<AppSyncFetchFlags> {
  if (fetch.carousel) return fetch;

  const carouselCache = await readCarouselConfigCache();
  if (!isBadCarouselCache(carouselCache)) return fetch;

  syncLog("carousel:bad-cache", {
    bannerCount: carouselCache?.carousel?.banners?.length ?? 0,
  });
  return { ...fetch, carousel: true };
}

async function resolveCategoryFetch(
  fetch: AppSyncFetchFlags,
  clientVersions: AppSyncClientVersions,
  serverCategoryVersion: number,
): Promise<AppSyncFetchFlags> {
  const categoryCache = await readCategoryConfigCache();
  const cacheFresh =
    Boolean(categoryCache) &&
    !isCategoryConfigStale(categoryCache!.fetchedAt);
  const clientCategory = clientVersions.category;
  const versionMatches =
    clientCategory != null && clientCategory >= serverCategoryVersion;

  let shouldFetchCategory = fetch.category;

  if (isBadCategoryCache(categoryCache)) {
    categoryLog("sync:bad-cache", {
      count: categoryCache?.categories?.length ?? 0,
    });
    shouldFetchCategory = true;
  } else if (!shouldFetchCategory) {
    const ttlStale =
      !categoryCache || isCategoryConfigStale(categoryCache.fetchedAt);
    if (ttlStale) {
      categoryLog("sync:ttl:decision", {
        shouldFetch: true,
        hadCache: Boolean(categoryCache),
        ageMs: categoryCache ? Date.now() - categoryCache.fetchedAt : null,
      });
      shouldFetchCategory = true;
    }
  } else if (versionMatches && cacheFresh) {
    categoryLog("sync:skip:decision", {
      shouldFetch: false,
      reason: "fresh-cache-version-match",
      clientCategory,
      serverCategory: serverCategoryVersion,
      ageMs: categoryCache ? Date.now() - categoryCache.fetchedAt : null,
    });
    shouldFetchCategory = false;
  }

  return { ...fetch, category: shouldFetchCategory };
}

async function fetchStaleResources(
  dispatch: AppDispatch,
  fetch: AppSyncFetchFlags,
  userId?: string,
): Promise<void> {
  const staleKeys = (
    Object.entries(fetch) as [keyof AppSyncFetchFlags, boolean][]
  )
    .filter(([, shouldFetch]) => shouldFetch)
    .map(([key]) => key);

  syncLog("fetchStaleResources", {
    willFetch: staleKeys.length ? staleKeys : "none",
    flags: fetch,
  });

  const tasks: Promise<void>[] = [];

  if (fetch.offers) {
    tasks.push(
      runFetchTask("offers", async () => {
        const offers = await dispatch(
          offerApi.endpoints.fetchOffers.initiate(undefined, {
            forceRefetch: true,
          }),
        ).unwrap();
        const cached = await readPromoConfigCache();
        const deliverySettings =
          cached?.deliverySettings ??
          (await dispatch(
            deliverySettingsApi.endpoints.fetchDeliverySettings.initiate(
              undefined,
            ),
          ).unwrap());
        hydratePromoConfigCache(dispatch, {
          fetchedAt: Date.now(),
          offers,
          deliverySettings,
        });
        await writePromoConfigCache(offers, deliverySettings);
      }),
    );
  }

  if (fetch.deliverySettings) {
    tasks.push(
      runFetchTask("deliverySettings", async () => {
        const deliverySettings = await dispatch(
          deliverySettingsApi.endpoints.fetchDeliverySettings.initiate(
            undefined,
            { forceRefetch: true },
          ),
        ).unwrap();
        const cached = await readPromoConfigCache();
        const offers =
          cached?.offers ??
          (await dispatch(
            offerApi.endpoints.fetchOffers.initiate(undefined),
          ).unwrap());
        hydratePromoConfigCache(dispatch, {
          fetchedAt: Date.now(),
          offers,
          deliverySettings,
        });
        await writePromoConfigCache(offers, deliverySettings);
      }),
    );
  }

  if (fetch.carousel) {
    tasks.push(
      runFetchTask("carousel", async () => {
        const carousel = await dispatch(
          carouselApi.endpoints.fetchCarousel.initiate(undefined, {
            forceRefetch: true,
          }),
        ).unwrap();
        hydrateCarouselConfigCache(dispatch, {
          fetchedAt: Date.now(),
          carousel,
        });
        await writeCarouselConfigCache(carousel);
      }),
    );
  }

  if (fetch.storeConfig) {
    tasks.push(
      runFetchTask("storeConfig", async () => {
        const storeConfig = await dispatch(
          storeConfigApi.endpoints.fetchStoreConfig.initiate(undefined, {
            forceRefetch: true,
          }),
        ).unwrap();
        hydrateStoreConfigCache(dispatch, {
          fetchedAt: Date.now(),
          storeConfig,
        });
        await writeStoreConfigCache(storeConfig);
      }),
    );
  }

  if (fetch.category) {
    tasks.push(
      runFetchTask("category", async () => {
        categoryLog("api:GET:network:start", { source: "syncAppState" });
        const result = await dispatch(
          categoryApi.endpoints.fetchCategories.initiate({}, {
            forceRefetch: true,
          }),
        ).unwrap();
        const categories = result?.categories ?? [];
        categoryLog("api:GET:network:ok", {
          source: "syncAppState",
          count: categories.length,
        });
        hydrateCategoryConfigCache(
          dispatch,
          {
            fetchedAt: Date.now(),
            categories,
          },
          "network-response",
        );
        await writeCategoryConfigCache(categories);
      }),
    );
  }

  const results = await Promise.allSettled(tasks);
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    syncLog("fetchStaleResources:partial-failure", {
      failed: failed.length,
      total: results.length,
    });
  } else {
    syncLog("fetchStaleResources:done", { tasks: results.length });
  }
}

export async function syncAppState(
  dispatch: AppDispatch,
  options: SyncAppStateOptions,
): Promise<void> {
  if (syncInFlight) {
    syncLog("deduped — sync already in flight");
    return syncInFlight;
  }

  syncInFlight = (async () => {
    const startedAt = Date.now();
    dispatch(setSyncStarted());

    syncLog("start", {
      userId: options.userId,
      isGuestUser: options.isGuestUser,
      hasToken: Boolean(options.token),
    });

    try {
      const recentSearchPrefetch = options.userId
        ? prefetchRecentSearchFromStorage(dispatch, options.userId).catch(
            () => null,
          )
        : Promise.resolve(null);

      await hydrateLocalCaches(dispatch, options.userId);

      const clientVersions = await readAppSyncClientVersions();
      syncLog("clientVersions", clientVersions);

      const [syncResponse, prefetchedRecentSearch] = await Promise.all([
        postSyncState(clientVersions, options.token),
        recentSearchPrefetch,
      ]);
      let effectiveFetch = options.isGuestUser
        ? filterFetchForGuest(syncResponse.fetch)
        : syncResponse.fetch;

      effectiveFetch = await resolveCategoryFetch(
        effectiveFetch,
        clientVersions,
        syncResponse.server.category,
      );
      effectiveFetch = await resolveCarouselFetch(effectiveFetch);

      syncLog("effectiveFetch", effectiveFetch);

      const recentSearchSync = options.userId
        ? syncRecentSearch(dispatch, options.userId, {
            prefetchedCache: prefetchedRecentSearch,
            localOnly: Boolean(options.isGuestUser),
          }).catch(() => {})
        : Promise.resolve();

      await Promise.all([
        fetchStaleResources(dispatch, effectiveFetch, options.userId),
        recentSearchSync,
      ]);

      if (options.isGuestUser) {
        const nextVersions = {
          ...clientVersions,
          carousel: syncResponse.server.carousel,
          category: syncResponse.server.category,
        };
        await writeAppSyncClientVersions(nextVersions);
        syncLog("versions:saved:guest", nextVersions);
      } else {
        const nextVersions = buildUpdatedClientVersions(syncResponse.server);
        await writeAppSyncClientVersions(nextVersions);
        syncLog("versions:saved:customer", nextVersions);
      }

      const completePayload = {
        fetch: effectiveFetch,
      };
      dispatch(setSyncComplete(completePayload));
      syncLog("complete", {
        ...completePayload,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      syncLog("error:fallback-ready", error);
      dispatch(
        setSyncComplete({
          fetch: {
            carousel: true,
            offers: !options.isGuestUser,
            deliverySettings: !options.isGuestUser,
            storeConfig: !options.isGuestUser,
            category: true,
          },
        }),
      );
      syncLog("complete:fallback", { durationMs: Date.now() - startedAt });
    }
  })().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}
