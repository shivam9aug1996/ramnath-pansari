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
import { clearProductCache } from "@/utils/productCache";
import { devLog, devWarn } from "@/utils/devLog";

type AppDispatch = typeof store.dispatch;

export type SyncAppStateOptions = {
  token?: string | null;
  userId?: string;
  isGuestUser?: boolean;
};

let syncInFlight: Promise<void> | null = null;
let syncInFlightKey: string | null = null;


function syncKey(options: SyncAppStateOptions): string {
  return `${options.userId ?? "none"}:${Boolean(options.isGuestUser)}`;
}

async function postSyncState(
  client: AppSyncClientVersions,
  token?: string | null,
): Promise<AppSyncResponse> {
  const { getAppCheckToken, APP_CHECK_HEADER } = await import("@/utils/appCheck");
  const appCheckToken = await getAppCheckToken();

  const response = await fetch(`${baseUrl}/app/sync-state`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(appCheckToken ? { [APP_CHECK_HEADER]: appCheckToken } : {}),
    },
    credentials: "include",
    body: JSON.stringify({ client }),
  });

  if (!response.ok) {
    throw new Error(`sync-state failed (${response.status})`);
  }

  const body = (await response.json()) as AppSyncResponse;
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

  if (promoCache) hydratePromoConfigCache(dispatch, promoCache);
  if (carouselCache) hydrateCarouselConfigCache(dispatch, carouselCache);
  devLog("[store-config] syncAppState hydrateLocal", {
    hasStoreCache: Boolean(storeCache),
    fetchedAt: storeCache?.fetchedAt ?? null,
  });
  if (storeCache) await hydrateStoreConfigCache(dispatch, storeCache);
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
    product: false,
  };
}

async function fetchStaleResources(
  dispatch: AppDispatch,
  fetch: AppSyncFetchFlags,
): Promise<void> {
  const tasks: Promise<void>[] = [];

  if (fetch.offers) {
    tasks.push(
      (async () => {
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
      })(),
    );
  }

  if (fetch.deliverySettings) {
    tasks.push(
      (async () => {
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
      })(),
    );
  }

  if (fetch.carousel) {
    tasks.push(
      (async () => {
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
      })(),
    );
  }

  if (fetch.storeConfig) {
    tasks.push(
      (async () => {
        devLog("[store-config] syncAppState fetchStale start");
        try {
          const storeConfig = await dispatch(
            storeConfigApi.endpoints.fetchStoreConfig.initiate(undefined, {
              forceRefetch: true,
            }),
          ).unwrap();
          if (!storeConfig?.storeConfig) {
            devWarn("[store-config] syncAppState fetchStale empty", storeConfig);
            return;
          }
          await hydrateStoreConfigCache(dispatch, {
            fetchedAt: Date.now(),
            storeConfig,
          });
          await writeStoreConfigCache(storeConfig);
          devLog("[store-config] syncAppState fetchStale ok");
        } catch (error) {
          devWarn("[store-config] syncAppState fetchStale failed", error);
          throw error;
        }
      })(),
    );
  }

  if (fetch.category) {
    tasks.push(
      (async () => {
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
      })(),
    );
  }

  if (fetch.product) {
    tasks.push(clearProductCache());
  }

  await Promise.allSettled(tasks);
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
    return syncInFlight;
  }

  if (syncInFlight) {
    await syncInFlight.catch(() => {});
  }

  syncInFlightKey = key;
  syncInFlight = (async () => {
    dispatch(setSyncStarted());

    try {
      await hydrateLocalCaches(dispatch);

      const clientVersions = await readAppSyncClientVersions();

      const syncResponse = await postSyncState(clientVersions, options.token);
      const effectiveFetch = options.isGuestUser
        ? filterFetchForGuest(syncResponse.fetch)
        : syncResponse.fetch;

      devLog("[store-config] syncAppState fetch flags", {
        isGuestUser: Boolean(options.isGuestUser),
        serverStoreConfig: syncResponse.fetch.storeConfig,
        effectiveStoreConfig: effectiveFetch.storeConfig,
      });

      await fetchStaleResources(dispatch, effectiveFetch);

      if (options.isGuestUser) {
        const nextVersions = {
          ...clientVersions,
          carousel: syncResponse.server.carousel,
          category: syncResponse.server.category,
        };
        await writeAppSyncClientVersions(nextVersions);
      } else {
        const nextVersions = buildUpdatedClientVersions(syncResponse.server);
        await writeAppSyncClientVersions(nextVersions);
      }

      dispatch(setSyncComplete({ fetch: effectiveFetch }));
    } catch (error) {
      dispatch(
        setSyncComplete({
          fetch: {
            carousel: true,
            offers: !options.isGuestUser,
            deliverySettings: !options.isGuestUser,
            storeConfig: !options.isGuestUser,
            category: true,
            product: !options.isGuestUser,
          },
        }),
      );
    }
  })().finally(() => {
    if (syncInFlightKey === key) {
      syncInFlight = null;
      syncInFlightKey = null;
    }
  });

  return syncInFlight;
}
