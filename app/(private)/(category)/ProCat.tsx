import { Platform } from "react-native";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import TryAgain from "./CategoryList/TryAgain";
import DeferredFadeIn from "@/components/DeferredFadeIn";
import CategoryList from "./CategoryList/CategoryList";
import Products from "./ProductList/Products";
import CategoryListWrapper from "./ProductList/CategoryListWrapper";
import GoToCartWrapper from "./ProductList/GoToCartWrapper";
import ProductFilterFab from "@/components/productFilters/ProductFilterFab";
import LazyProductFilterSheet, {
  preloadProductFilterSheet,
} from "@/components/productFilters/LazyProductFilterSheet";
import { useProductListFilters } from "@/components/productFilters/useProductListFilters";

import { RootState } from "@/types/global";
import {
  productApi,
  setSelectedSubCategoryId,
} from "@/redux/features/productSlice";
import { DEFAULT_PRODUCT_FILTERS } from "@/utils/productFilters";
import { devLog } from "@/utils/devLog";

type ProCatProps = {
  id: string;
  name: string;
  selectedCategoryIdIndex: number;
};

type ProductsData = {
  totalResults?: number;
  totalProducts?: number;
  products?: unknown[];
};

const ProCat = ({ id, name, selectedCategoryIdIndex }: ProCatProps) => {
  const isCategoryFetching = false;
  const isCategoryFetchingError = false;

  const dispatch = useDispatch();

  const getCategories = useSelector(
    (state: RootState) => state?.category?.catgeoryData,
  );
  const selectedSubCategory = useSelector(
    (state: RootState) => state.product.selectedSubCategoryId,
  );

  const productsResetRef = useRef<(() => void) | null>(null);

  const registerProductsReset = useCallback((fn: () => void) => {
    productsResetRef.current = fn;
  }, []);

  const onFiltersApplied = useCallback(() => {
    productsResetRef.current?.();
  }, []);

  const {
    applied,
    draft,
    setDraft,
    brands,
    brandsLoading,
    filterKey,
    apiParams,
    filterVisible,
    openFilters,
    closeFilters,
    applyDraft,
    clearAll,
  } = useProductListFilters({
    categoryId: selectedSubCategory?._id,
    onFiltersApplied,
  });

  const categoryId = selectedSubCategory?._id;

  const productsQueryArgs = useMemo(
    () => ({
      categoryId:
        categoryId && categoryId !== "null" ? categoryId : undefined,
      page: 1,
      limit: 10,
      filterKey,
      ...apiParams,
    }),
    [categoryId, filterKey, apiParams],
  );

  const productsQueryState = useSelector(
    productApi.endpoints.fetchProducts.select(productsQueryArgs),
  );

  const productsData = productsQueryState?.data as ProductsData | undefined;

  const resultCount =
    productsData?.totalResults ?? productsData?.totalProducts;
  const loadedCount = Array.isArray(productsData?.products)
    ? productsData.products.length
    : undefined;

  const handleOpenFilters = useCallback(() => {
    void preloadProductFilterSheet();
    openFilters();
  }, [openFilters]);

  const handleClearFilters = useCallback(() => {
    setDraft(DEFAULT_PRODUCT_FILTERS);
    clearAll();
  }, [setDraft, clearAll]);

  const parentCategory = useMemo(() => ({ _id: id, name }), [id, name]);

  useEffect(() => {
    devLog("[products] ProCat mount → reset selectedSubCategoryId to null", {
      id,
      name,
      selectedCategoryIdIndex,
      childrenCount: getCategories?.children?.length ?? null,
    });
    dispatch(setSelectedSubCategoryId("null"));
  }, [dispatch, id, name, selectedCategoryIdIndex, getCategories?.children?.length]);

  return (
    <>
      <ScreenSafeWrapper
        showCartIcon={true}
        title={name}
        showSearchIcon={true}
        wrapperStyle={styles.screenWrapper}
      >
        {isCategoryFetchingError ? (
          <TryAgain refetch={() => {}} />
        ) : (
          <>
            <CategoryListWrapper>
              <DeferredFadeIn delay={0}>
                <CategoryList
                  contentContainerStyle={styles.categoryListContent}
                  categories={getCategories?.children}
                  isCategoryFetching={isCategoryFetching}
                  selectedCategoryIdIndex={selectedCategoryIdIndex}
                  parentCategory={parentCategory}
                />
                <ProductFilterFab
                  filters={applied}
                  onPress={handleOpenFilters}
                  onClear={clearAll}
                  resultCount={
                    typeof resultCount === "number" ? resultCount : undefined
                  }
                  loadedCount={loadedCount}
                />
              </DeferredFadeIn>
            </CategoryListWrapper>

            <DeferredFadeIn style={styles.flex1} delay={200}>
              <Products
                isCategoryFetching={isCategoryFetching}
                filterKey={filterKey}
                apiParams={apiParams}
                registerReset={registerProductsReset}
              />
            </DeferredFadeIn>
          </>
        )}
      </ScreenSafeWrapper>

      <LazyProductFilterSheet
        visible={filterVisible}
        draft={draft}
        onChange={setDraft}
        brands={brands}
        brandsLoading={brandsLoading}
        onApply={applyDraft}
        onClear={handleClearFilters}
        onClose={closeFilters}
      />

      <GoToCartWrapper
        showGoToCart={true}
        extraBottomOffset={Platform.OS === "web" ? -10 : 0}
      />
    </>
  );
};

export default memo(ProCat);

const styles = {
  flex1: {
    flex: 1,
  },
  screenWrapper: {
    paddingBottom: 0,
    marginBottom: 0,
  },
  categoryListContent: {
    paddingHorizontal: 30,
  },
};