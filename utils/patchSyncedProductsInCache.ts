import AsyncStorage from "@react-native-async-storage/async-storage";
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
): boolean {
  let patched = false;
  if (synced.newMaxQuantity != null) {
    product.maxQuantity = synced.newMaxQuantity;
    patched = true;
  }
  if (synced.newPrice != null) {
    product.price = synced.newPrice;
    patched = true;
  }
  if (synced.newDiscountedPrice != null) {
    product.discountedPrice = synced.newDiscountedPrice;
    patched = true;
  }
  if (synced.newIsOutOfStock != null) {
    product.isOutOfStock = synced.newIsOutOfStock;
    patched = true;
  }
  return patched;
}

async function patchAsyncStorageProductPages(
  updates: SyncedProductResult[],
): Promise<void> {
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
        if (product && applySyncedFields(product, synced)) {
          patchedOnPage++;
        }
      }

      if (patchedOnPage > 0) {
        await AsyncStorage.setItem(
          key,
          JSON.stringify({ ...parsed, timestamp: Date.now() }),
        );
      }
    }
  } catch {
    // Best-effort cache patch; RTK overrides still apply.
  }
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

  if (!updates.length) {
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

  await patchAsyncStorageProductPages(updates);

  const state = store.getState();
  const productQueries = state.productApi?.queries ?? {};

  for (const key of Object.keys(productQueries)) {
    if (!key.startsWith("fetchProducts-")) continue;

    const entry = productQueries[key];
    if (!entry?.data?.products?.length) continue;

    const categoryId = key.replace("fetchProducts-", "");

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
              applySyncedFields(product, synced);
            }
          }
        },
      ),
    );
  }

  const searchQueries = state.searchApi?.queries ?? {};

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
              applySyncedFields(product, synced);
            }
          }
        },
      ),
    );
  }

  for (const synced of updates) {
    dispatch(
      productApi.util.updateQueryData(
        "fetchProductDetail",
        { productId: synced.productId },
        (draft) => {
          if (draft?.product?._id === synced.productId) {
            applySyncedFields(draft.product, synced);
          }
        },
      ),
    );
  }
}
