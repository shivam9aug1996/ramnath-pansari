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
  /** Called when applied filters change (after apply / clear / chip remove / sort). */
  onFiltersApplied?: (filters: ProductFilterValues) => void;
};

export function useProductListFilters({
  categoryId,
  searchQuery,
  onFiltersApplied,
}: UseProductListFiltersArgs) {
  const [applied, setApplied] = useState<ProductFilterValues>(
    DEFAULT_PRODUCT_FILTERS,
  );
  const [draft, setDraft] = useState<ProductFilterValues>(
    DEFAULT_PRODUCT_FILTERS,
  );
  const [sortVisible, setSortVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  // Reset filter states when category or search query changes
  useEffect(() => {
    setApplied(DEFAULT_PRODUCT_FILTERS);
    setDraft(DEFAULT_PRODUCT_FILTERS);
  }, [categoryId, searchQuery]);

  const brandsArgs = useMemo(() => {
    if (categoryId && categoryId !== "null") {
      return { categoryId };
    }
    if (searchQuery) {
      return { query: searchQuery };
    }
    return null;
  }, [categoryId, searchQuery]);

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