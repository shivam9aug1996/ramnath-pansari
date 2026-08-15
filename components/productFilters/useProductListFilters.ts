import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_PRODUCT_FILTERS,
  ProductFilterValues,
  ProductSortOption,
  getProductFilterKey,
  productFiltersToApiParams,
} from "@/utils/productFilters";
import { useFetchProductBrandsQuery } from "@/redux/features/productSlice";

type UseProductListFiltersArgs = {
  categoryId?: string | null;
  searchQuery?: string;
  /** Seed brand filters (e.g. deep link from search brands chips). */
  initialBrands?: string[];
  /** Called when applied filters change (after apply / clear / chip remove / sort). */
  onFiltersApplied?: (filters: ProductFilterValues) => void;
};

function filtersFromInitialBrands(
  brands?: string[],
): ProductFilterValues {
  const cleaned = (brands ?? [])
    .map((b) => b.trim())
    .filter(Boolean);
  if (!cleaned.length) return DEFAULT_PRODUCT_FILTERS;
  return { ...DEFAULT_PRODUCT_FILTERS, brands: cleaned };
}

export function useProductListFilters({
  categoryId,
  searchQuery,
  initialBrands,
  onFiltersApplied,
}: UseProductListFiltersArgs) {
  const initialBrandsKey = useMemo(
    () =>
      (initialBrands ?? [])
        .map((b) => b.trim())
        .filter(Boolean)
        .join(","),
    [initialBrands],
  );

  const initialFilters = useMemo(
    () =>
      filtersFromInitialBrands(
        initialBrandsKey ? initialBrandsKey.split(",") : [],
      ),
    [initialBrandsKey],
  );

  const [applied, setApplied] =
    useState<ProductFilterValues>(initialFilters);
  const [draft, setDraft] = useState<ProductFilterValues>(initialFilters);
  const [sortVisible, setSortVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  // Reset when category / search / deep-linked brands change
  useEffect(() => {
    setApplied(initialFilters);
    setDraft(initialFilters);
  }, [categoryId, searchQuery, initialFilters]);

  const brandsArgs = useMemo(() => {
    if (categoryId && categoryId !== "null") {
      return { categoryId };
    }
    if (searchQuery) {
      return { query: searchQuery };
    }
    // Brand-only browse: seed brand facet list from the applied brand name.
    if (initialBrandsKey) {
      return { query: initialBrandsKey.split(",")[0] };
    }
    return null;
  }, [categoryId, searchQuery, initialBrandsKey]);

  const { data: brandsData, isFetching: brandsLoading } =
    useFetchProductBrandsQuery(brandsArgs ?? { categoryId: "" }, {
      skip: !brandsArgs,
    });

  const brands = useMemo(() => brandsData?.brands ?? [], [brandsData?.brands]);

  const filterKey = useMemo(() => getProductFilterKey(applied), [applied]);

  const apiParams = useMemo(
    () => productFiltersToApiParams(applied),
    [applied],
  );

  const commit = useCallback(
    (next: ProductFilterValues) => {
      setApplied(next);
      setDraft(next);
      onFiltersApplied?.(next);
    },
    [onFiltersApplied],
  );

  const openSort = useCallback(() => setSortVisible(true), []);
  const closeSort = useCallback(() => setSortVisible(false), []);

  const openFilters = useCallback(() => {
    setDraft(applied);
    setFilterVisible(true);
  }, [applied]);

  const closeFilters = useCallback(() => setFilterVisible(false), []);

  const selectSort = useCallback(
    (sort: ProductSortOption) => {
      commit({ ...applied, sort });
    },
    [applied, commit],
  );

  const applyDraft = useCallback(() => {
    commit(draft);
    setFilterVisible(false);
  }, [commit, draft]);

  const clearAll = useCallback(() => {
    commit(DEFAULT_PRODUCT_FILTERS);
    setFilterVisible(false);
  }, [commit]);

  const patchApplied = useCallback(
    (next: ProductFilterValues) => {
      commit(next);
    },
    [commit],
  );

  return {
    applied,
    draft,
    setDraft,
    brands,
    brandsLoading,
    filterKey,
    apiParams,
    sortVisible,
    filterVisible,
    openSort,
    closeSort,
    openFilters,
    closeFilters,
    selectSort,
    applyDraft,
    clearAll,
    patchApplied,
  };
}
