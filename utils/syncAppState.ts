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
  readCategoryConfigCache,
  writeCategoryConfigCache,
} from "@/utils/categoryConfigCache";

type AppDispatch = typeof store.dispatch;

export type SyncAppStateOptions = {
  token?: string | null;
  userId?: string;
  isGuestUser?: boolean;
};

let syncInFlight: Promise<void> | null = null;
let syncInFlightKey: string | null = null;

function syncLog(label: string, data?: unknown): void {
  if (!__DEV__) return;
  if (data !== undefined) {
    console.log(`[app-sync] ${label}`, data);
  } else {
    console.log(`[app-sync] ${label}`);
  }
}

function syncKey(options: SyncAppStateOptions): string {
  return `${options.userId ?? "none"}:${Boolean(options.isGuestUser)}`;
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

async function hydrateLocalCaches(dispatch: AppDispatch): Promise<void> {
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

/** Guests only need shared browsing data (banners + categories). */
function filterFetchForGuest(fetch: AppSyncFetchFlags): AppSyncFetchFlags {
  return {
    carousel: fetch.carousel,
    category: fetch.category,
    offers: false,
    deliverySettings: false,
    storeConfig: false,
  };
}

async function fetchStaleResources(
  dispatch: AppDispatch,
  fetch: AppSyncFetchFlags,
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
        const result = await dispatch(
          categoryApi.endpoints.fetchCategories.initiate(
            {},
            { forceRefetch: true },
          ),
        ).unwrap();
        const categories = result?.categories ?? [];
        hydrateCategoryConfigCache(
          dispatch,
          { fetchedAt: Date.now(), categories },
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

/**
 * Global config sync only (carousel, category, offers, delivery, store).
 * Recent search is handled separately — see loadRecentSearch.
 */
export async function syncAppState(
  dispatch: AppDispatch,
  options: SyncAppStateOptions,
): Promise<void> {
  const key = syncKey(options);

  if (syncInFlight && syncInFlightKey === key) {
    syncLog("deduped — same sync already in flight", { key });
    return syncInFlight;
  }

  if (syncInFlight) {
    syncLog("awaiting previous sync before identity change", {
      previous: syncInFlightKey,
      next: key,
    });
    await syncInFlight.catch(() => {});
  }

  syncInFlightKey = key;
  syncInFlight = (async () => {
    const startedAt = Date.now();
    dispatch(setSyncStarted());

    syncLog("start", {
      userId: options.userId,
      isGuestUser: options.isGuestUser,
      hasToken: Boolean(options.token),
    });

    try {
      await hydrateLocalCaches(dispatch);

      const clientVersions = await readAppSyncClientVersions();
      syncLog("clientVersions", clientVersions);

      const syncResponse = await postSyncState(clientVersions, options.token);
      const effectiveFetch = options.isGuestUser
        ? filterFetchForGuest(syncResponse.fetch)
        : syncResponse.fetch;

      syncLog("effectiveFetch", effectiveFetch);

      await fetchStaleResources(dispatch, effectiveFetch);

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

      dispatch(setSyncComplete({ fetch: effectiveFetch }));
      syncLog("complete", {
        fetch: effectiveFetch,
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
    if (syncInFlightKey === key) {
      syncInFlight = null;
      syncInFlightKey = null;
    }
  });

  return syncInFlight;
}
