import AsyncStorage from "@react-native-async-storage/async-storage";
import { CACHE_DURATION } from "@/utils/utils";

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
  if(page>1){
    await new Promise(resolve => setTimeout(resolve, 500));
  }
 // await new Promise(resolve => setTimeout(resolve, 100));
  const mem = memoryCache.get(localKey);
  if (mem && now - mem.timestamp < CACHE_DURATION) {
    return mem.data as T;
  }

  const cached = await AsyncStorage.getItem(localKey);
  
  if (!cached) return null;

  try {
    const parsed = JSON.parse(cached) as CacheEntry<T>;
    if (now - parsed.timestamp < CACHE_DURATION) {
      memoryCache.set(localKey, parsed);
      return parsed.data;
    }
  } catch {
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