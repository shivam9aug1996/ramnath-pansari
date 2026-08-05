export type ProductSortOption =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "name_asc";

export type ProductFilterValues = {
  brands: string[];
  sort: ProductSortOption;
  inStockOnly: boolean;
  priceMin: string;
  priceMax: string;
};

export const DEFAULT_PRODUCT_FILTERS: ProductFilterValues = {
  brands: [],
  sort: "relevance",
  inStockOnly: false,
  priceMin: "",
  priceMax: "",
};

/** Stable cache / RTK fingerprint. Empty filters → `default`. */
export function getProductFilterKey(
  filters: Partial<ProductFilterValues> | null | undefined,
): string {
  if (!filters) return "default";

  const brands = [...(filters.brands ?? [])]
    .map((b) => b.trim().toLowerCase())
    .filter(Boolean)
    .sort();
  const sort = filters.sort && filters.sort !== "relevance" ? filters.sort : "";
  const inStock = filters.inStockOnly ? "1" : "";
  const priceMin = filters.priceMin?.trim() ?? "";
  const priceMax = filters.priceMax?.trim() ?? "";

  if (
    brands.length === 0 &&
    !sort &&
    !inStock &&
    !priceMin &&
    !priceMax
  ) {
    return "default";
  }

  const parts: string[] = [];
  if (brands.length) parts.push(`b:${brands.join(",")}`);
  if (sort) parts.push(`s:${sort}`);
  if (inStock) parts.push(`stock:1`);
  if (priceMin || priceMax) parts.push(`p:${priceMin}-${priceMax}`);
  return parts.join("|");
}

export function hasActiveProductFilters(
  filters: ProductFilterValues | null | undefined,
): boolean {
  return getProductFilterKey(filters) !== "default";
}

export function countActiveProductFilters(
  filters: ProductFilterValues | null | undefined,
): number {
  if (!filters) return 0;
  let count = 0;
  if (filters.brands.length) count += 1;
  if (filters.sort && filters.sort !== "relevance") count += 1;
  if (filters.inStockOnly) count += 1;
  if (filters.priceMin.trim() || filters.priceMax.trim()) count += 1;
  return count;
}

/** Query params for GET /products and GET /search (excludes page/limit/categoryId/query). */
export function productFiltersToApiParams(
  filters: ProductFilterValues | null | undefined,
): Record<string, string | boolean | number> {
  if (!filters) return {};

  const params: Record<string, string | boolean | number> = {};

  if (filters.brands.length) {
    params.brand = filters.brands.map((b) => b.trim()).filter(Boolean).join(",");
  }
  if (filters.sort && filters.sort !== "relevance") {
    params.sort = filters.sort;
  }
  if (filters.inStockOnly) {
    params.inStock = true;
  }
  const min = filters.priceMin.trim();
  const max = filters.priceMax.trim();
  if (min !== "" && !Number.isNaN(Number(min))) {
    params.priceMin = Number(min);
  }
  if (max !== "" && !Number.isNaN(Number(max))) {
    params.priceMax = Number(max);
  }

  return params;
}

export const PRODUCT_SORT_OPTIONS: {
  value: ProductSortOption;
  label: string;
}[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name_asc", label: "Name: A to Z" },
];

/**
 * Unfiltered pages keep legacy key `products-{categoryId}-{page}` so existing
 * AsyncStorage entries remain valid. Filtered pages append `-{filterKey}`.
 */
export function getProductCacheKey(
  categoryId: string,
  page: number,
  filterKey: string = "default",
): string {
  const base = `products-${categoryId}-${page}`;
  if (!filterKey || filterKey === "default") return base;
  return `${base}-${filterKey}`;
}
