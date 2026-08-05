import AsyncStorage from "@react-native-async-storage/async-storage";
import { CACHE_DURATION } from "@/utils/utils";
import { getProductCacheKey } from "@/utils/productFilters";
import { devLog } from "@/utils/devLog";

export { getProductCacheKey } from "@/utils/productFilters";

type CacheEntry<T = any> = {
  data: T;
  timestamp: number;
};

const memoryCache = new Map<string, CacheEntry>();

export async function getCachedProducts<T = any>(
  categoryId: string,
  page: number,
  filterKey: string = "default",
): Promise<T | null> {
  const localKey = getProductCacheKey(categoryId, page, filterKey);
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
      filterKey,
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
    devLog("[products] cache miss (no entry)", {
      categoryId,
      page,
      filterKey,
      localKey,
    });
    return null;
  }

  try {
    const parsed = JSON.parse(cached) as CacheEntry<T>;
    const age = now - parsed.timestamp;
    const valid = age < CACHE_DURATION;
    devLog("[products] cache check (disk)", {
      categoryId,
      page,
      filterKey,
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
      filterKey,
      ageMs: age,
      cacheDurationMs: CACHE_DURATION,
    });
  } catch {
    devLog("[products] cache parse error", {
      categoryId,
      page,
      filterKey,
      localKey,
    });
    return null;
  }

  return null;
}

export function setCachedProducts<T = any>(
  categoryId: string,
  page: number,
  data: T,
  filterKey: string = "default",
): void {
  const localKey = getProductCacheKey(categoryId, page, filterKey);
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
