import AsyncStorage from "@react-native-async-storage/async-storage";
import { devLog, devWarn } from "@/utils/devLog";
import {
  applySyncedProductOverrides,
  productApi,
} from "@/redux/features/productSlice";
import { searchApi } from "@/redux/features/searchSlice";
import store from "@/redux/store";

export type SyncedProductResult = {
  productId: string;
  status: string;
  name?: string;
  newPrice?: number;
  newDiscountedPrice?: number;
  newMaxQuantity?: number;
  newIsOutOfStock?: boolean;
};

const PATCHABLE_SYNC_STATUSES = new Set(["updated", "not_found_in_jioMart"]);

/** Map API sync payload → cache patch entries (incl. JioMart not-found → OOS). */
export function normalizeSyncResultsForCache(
  raw:
    | SyncedProductResult[]
    | Array<Record<string, unknown>>
    | undefined
    | null,
): SyncedProductResult[] {
  if (!raw?.length) return [];

  return raw
    .filter((item) => item?.productId)
    .map((item) => {
      const productId = String(item.productId);
      const status = String(item.status ?? "");

      if (status === "not_found_in_jioMart") {
        return {
          productId,
          status,
          name: item.name as string | undefined,
          newIsOutOfStock: true,
        };
      }

      if (status === "updated") {
        return {
          productId,
          status,
          name: item.name as string | undefined,
          newMaxQuantity: item.newMaxQuantity as number | undefined,
          newPrice: item.newPrice as number | undefined,
          newDiscountedPrice: item.newDiscountedPrice as number | undefined,
          newIsOutOfStock: item.newIsOutOfStock as boolean | undefined,
        };
      }

      return { productId, status, name: item.name as string | undefined };
    });
}

function hasPatchableFields(synced: SyncedProductResult) {
  return (
    synced.newMaxQuantity != null ||
    synced.newPrice != null ||
    synced.newDiscountedPrice != null ||
    synced.newIsOutOfStock != null
  );
}

type PatchableProduct = {
  _id?: string;
  maxQuantity?: number;
  price?: number;
  discountedPrice?: number;
  isOutOfStock?: boolean;
};

function applySyncedFields(
  product: PatchableProduct,
  synced: SyncedProductResult,
): string[] {
  const patched: string[] = [];
  if (synced.newMaxQuantity != null) {
    product.maxQuantity = synced.newMaxQuantity;
    patched.push(`maxQuantity=${synced.newMaxQuantity}`);
  }
  if (synced.newPrice != null) {
    product.price = synced.newPrice;
    patched.push(`price=${synced.newPrice}`);
  }
  if (synced.newDiscountedPrice != null) {
    product.discountedPrice = synced.newDiscountedPrice;
    patched.push(`discountedPrice=${synced.newDiscountedPrice}`);
  }
  if (synced.newIsOutOfStock != null) {
    product.isOutOfStock = synced.newIsOutOfStock;
    patched.push(`isOutOfStock=${synced.newIsOutOfStock}`);
  }
  return patched;
}

async function patchAsyncStorageProductPages(
  updates: SyncedProductResult[],
): Promise<number> {
  let pagesPatched = 0;
  let productsPatched = 0;

  try {
    const keys = await AsyncStorage.getAllKeys();
    const productKeys = keys.filter((k) => k.startsWith("products-"));

    for (const key of productKeys) {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;

      let parsed: { data?: { products?: PatchableProduct[] }; timestamp?: number };
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }

      const products = parsed?.data?.products;
      if (!Array.isArray(products) || !products.length) continue;

      let patchedOnPage = 0;
      for (const synced of updates) {
        const product = products.find((p) => p._id === synced.productId);
        if (product && applySyncedFields(product, synced).length) {
          patchedOnPage++;
        }
      }

      if (patchedOnPage > 0) {
        await AsyncStorage.setItem(
          key,
          JSON.stringify({ ...parsed, timestamp: Date.now() }),
        );
        pagesPatched++;
        productsPatched += patchedOnPage;
        devLog("[cart-sync] patch:asyncStorage", {
          key,
          patchedOnPage,
        });
      }
    }
  } catch (error) {
    devWarn("[cart-sync] patch:asyncStorage failed", error);
  }

  return pagesPatched + productsPatched;
}

export async function patchSyncedProductsInCache(
  dispatch: typeof store.dispatch,
  syncedProducts:
    | SyncedProductResult[]
    | Array<Record<string, unknown>>
    | undefined
    | null,
) {
  const normalized = normalizeSyncResultsForCache(syncedProducts);
  const updates = normalized.filter(
    (p) => PATCHABLE_SYNC_STATUSES.has(p.status) && hasPatchableFields(p),
  );

  devLog("[cart-sync] patchSyncedProductsInCache:start", {
    totalSyncResults: syncedProducts?.length ?? 0,
    normalizedCount: normalized.length,
    applicableUpdates: updates.length,
    updates: updates.map((u) => ({
      productId: u.productId,
      status: u.status,
      newMaxQuantity: u.newMaxQuantity ?? null,
      newPrice: u.newPrice ?? null,
      newDiscountedPrice: u.newDiscountedPrice ?? null,
      newIsOutOfStock: u.newIsOutOfStock ?? null,
    })),
  });

  if (!updates.length) {
    devLog("[cart-sync] patchSyncedProductsInCache:skip — no patchable products");
    return;
  }

  dispatch(
    applySyncedProductOverrides(
      updates.map((u) => ({
        productId: u.productId,
        maxQuantity: u.newMaxQuantity,
        price: u.newPrice,
        discountedPrice: u.newDiscountedPrice,
        isOutOfStock: u.newIsOutOfStock,
      })),
    ),
  );
  devLog("[cart-sync] patch:overrides applied", {
    productIds: updates.map((u) => u.productId),
  });

  await patchAsyncStorageProductPages(updates);

  const state = store.getState();
  const productQueries = state.productApi?.queries ?? {};
  let listCategoriesPatched = 0;
  let listProductsPatched = 0;
  const patchedProductIds = new Set<string>();

  for (const key of Object.keys(productQueries)) {
    if (!key.startsWith("fetchProducts-")) continue;

    const entry = productQueries[key];
    if (!entry?.data?.products?.length) continue;

    const categoryId = key.replace("fetchProducts-", "");
    let patchedInCategory = 0;

    dispatch(
      productApi.util.updateQueryData(
        "fetchProducts",
        { categoryId, page: 1, limit: 10, reset: false },
        (draft) => {
          for (const synced of updates) {
            const product = draft.products?.find(
              (p) => p._id === synced.productId,
            );
            if (product) {
              patchedProductIds.add(synced.productId);
              const fields = applySyncedFields(product, synced);
              if (fields.length) {
                patchedInCategory++;
                devLog("[cart-sync] patch:list", {
                  categoryId,
                  productId: synced.productId,
                  name: product.name,
                  fields,
                });
              }
            }
          }
        },
      ),
    );

    if (patchedInCategory > 0) {
      listCategoriesPatched++;
      listProductsPatched += patchedInCategory;
    }
  }

  const notInRtkCache = updates
    .map((u) => u.productId)
    .filter((id) => !patchedProductIds.has(id));
  if (notInRtkCache.length) {
    devLog(
      "[cart-sync] patch:list not in loaded RTK pages (overrides still apply)",
      { productIds: notInRtkCache },
    );
  }

  const searchQueries = state.searchApi?.queries ?? {};
  let searchProductsPatched = 0;

  for (const key of Object.keys(searchQueries)) {
    if (!key.startsWith("fetchProductsBySearch")) continue;

    const entry = searchQueries[key];
    if (!entry?.data?.results?.length || !entry.originalArgs) continue;

    dispatch(
      searchApi.util.updateQueryData(
        "fetchProductsBySearch",
        entry.originalArgs,
        (draft) => {
          for (const synced of updates) {
            const product = draft.results?.find(
              (p: PatchableProduct) => p._id === synced.productId,
            );
            if (product) {
              const fields = applySyncedFields(product, synced);
              if (fields.length) {
                searchProductsPatched++;
                devLog("[cart-sync] patch:search", {
                  queryKey: key,
                  productId: synced.productId,
                  fields,
                });
              }
            }
          }
        },
      ),
    );
  }

  let detailProductsPatched = 0;
  for (const synced of updates) {
    dispatch(
      productApi.util.updateQueryData(
        "fetchProductDetail",
        { productId: synced.productId },
        (draft) => {
          if (draft?.product?._id === synced.productId) {
            const fields = applySyncedFields(draft.product, synced);
            if (fields.length) {
              detailProductsPatched++;
              devLog("[cart-sync] patch:detail", {
                productId: synced.productId,
                fields,
              });
            }
          }
        },
      ),
    );
  }

  devLog("[cart-sync] patchSyncedProductsInCache:done", {
    listCategoriesPatched,
    listProductsPatched,
    searchProductsPatched,
    detailProductsPatched,
    overrideCount: updates.length,
    notInRtkCache,
  });
}
