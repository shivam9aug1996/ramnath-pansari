import AsyncStorage from "@react-native-async-storage/async-storage";
import { CACHE_DURATION } from "@/utils/utils";
import { devLog } from "@/utils/devLog";

type CacheEntry<T = any> = {
  data: T;
  timestamp: number;
};

const memoryCache = new Map<string, CacheEntry>();

export const getProductCacheKey = (categoryId: string, page: number) =>
  `products-${categoryId}-${page}`;

export async function getCachedProducts<T = any>(
  categoryId: string,
  page: number,
): Promise<T | null> {
  const localKey = getProductCacheKey(categoryId, page);
  const now = Date.now();
  if (page > 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const mem = memoryCache.get(localKey);
  if (mem) {
    const age = now - mem.timestamp;
    const valid = age < CACHE_DURATION;
    devLog("[products] cache check (memory)", {
      categoryId,
      page,
      localKey,
      ageMs: age,
      expiresInMs: CACHE_DURATION - age,
      cacheDurationMs: CACHE_DURATION,
      valid,
      productCount: (mem.data as { products?: unknown[] })?.products?.length ?? null,
    });
    if (valid) return mem.data as T;
  }

  const cached = await AsyncStorage.getItem(localKey);

  if (!cached) {
    devLog("[products] cache miss (no entry)", { categoryId, page, localKey });
    return null;
  }

  try {
    const parsed = JSON.parse(cached) as CacheEntry<T>;
    const age = now - parsed.timestamp;
    const valid = age < CACHE_DURATION;
    devLog("[products] cache check (disk)", {
      categoryId,
      page,
      localKey,
      ageMs: age,
      expiresInMs: CACHE_DURATION - age,
      cacheDurationMs: CACHE_DURATION,
      valid,
      productCount:
        (parsed.data as { products?: unknown[] })?.products?.length ?? null,
    });
    if (valid) {
      memoryCache.set(localKey, parsed);
      return parsed.data;
    }
    devLog("[products] cache expired", {
      categoryId,
      page,
      ageMs: age,
      cacheDurationMs: CACHE_DURATION,
    });
  } catch {
    devLog("[products] cache parse error", { categoryId, page, localKey });
    return null;
  }

  return null;
}

export function setCachedProducts<T = any>(
  categoryId: string,
  page: number,
  data: T,
): void {
  const localKey = getProductCacheKey(categoryId, page);
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };

  memoryCache.set(localKey, entry);
  // Fire-and-forget — don't block the response on disk write
  AsyncStorage.setItem(localKey, JSON.stringify(entry)).catch(() => {});
}

export function clearProductMemoryCache(): void {
  memoryCache.clear();
}

export async function clearProductCache(): Promise<void> {
  memoryCache.clear();
  const keys = await AsyncStorage.getAllKeys();
  for (const key of keys) {
    if (key.startsWith("products-")) {
      await AsyncStorage.removeItem(key);
    }
  }
}

export async function clearCategoryProductCacheFromMemoryAndAsyncStorage(
  categoryId: string,
): Promise<void> {
  const prefix = `products-${categoryId}-`;

  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }

  const keys = await AsyncStorage.getAllKeys();
  const categoryKeys = keys.filter((key) => key.startsWith(prefix));
  if (categoryKeys.length) {
    await AsyncStorage.multiRemove(categoryKeys);
  }
}

/** Clears RTK Query `fetchProducts` cache for one category (not disk/memory). */
// export function clearCategoryProductCacheFromRedux(
//   dispatch: AppDispatch,
//   categoryId: string,
// ): void {
//   // Lazy import — productSlice imports this module for get/setCachedProducts.
//   const { productApi } =
//     require("@/redux/features/productSlice") as typeof import("@/redux/features/productSlice");

//   dispatch(
//     productApi.util.upsertQueryData(
//       "fetchProducts",
//       { categoryId, page: 1, limit: 10, reset: false },
//       {
//         products: [],
//         currentPage: 1,
//         totalPages: 0,
//         totalResults: 0,
//       },
//     ),
//   );
// }

