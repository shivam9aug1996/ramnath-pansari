import AsyncStorage from "@react-native-async-storage/async-storage";
import { categoryApi } from "@/redux/features/categorySlice";
import type store from "@/redux/store";
import type { Category } from "@/types/global";
import { isPromoConfigStale, PROMO_CONFIG_TTL_MS } from "@/utils/promoConfigCache";
import { runCategoryCacheHydration } from "@/utils/categoryDebug";

export const CATEGORY_CONFIG_CACHE_KEY = "@category/config";
export const CATEGORY_CONFIG_TTL_MS = PROMO_CONFIG_TTL_MS;

export type CategoryConfigCache = {
  fetchedAt: number;
  categories: Category[];
};

/** True when cached categories cannot populate the home category list. */
export function isBadCategoryCache(cache: CategoryConfigCache | null): boolean {
  if (!cache?.categories) return true;
  return cache.categories.length === 0;
}

type AppDispatch = typeof store.dispatch;

export function isCategoryConfigStale(
  fetchedAt: number,
  ttlMs = CATEGORY_CONFIG_TTL_MS,
): boolean {
  return isPromoConfigStale(fetchedAt, ttlMs);
}

export async function readCategoryConfigCache(): Promise<CategoryConfigCache | null> {
  try {
    const raw = await AsyncStorage.getItem(CATEGORY_CONFIG_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as CategoryConfigCache;
    if (!Array.isArray(parsed?.categories)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function writeCategoryConfigCache(
  categories: Category[],
  fetchedAt = Date.now(),
): Promise<void> {
  const payload: CategoryConfigCache = { fetchedAt, categories };
  await AsyncStorage.setItem(CATEGORY_CONFIG_CACHE_KEY, JSON.stringify(payload));
}

export function hydrateCategoryConfigCache(
  dispatch: AppDispatch,
  cache: CategoryConfigCache,
  _source: "storage" | "network-response" = "storage",
): void {
  runCategoryCacheHydration(() => {
    dispatch(
      categoryApi.util.upsertQueryData("fetchCategories", {}, {
        categories: cache.categories,
      }),
    );
  });
}
