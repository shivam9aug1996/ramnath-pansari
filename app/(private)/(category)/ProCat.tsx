import { Platform } from "react-native";
import React, { memo, useCallback, useEffect, useRef } from "react";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import TryAgain from "./CategoryList/TryAgain";
import DeferredFadeIn from "@/components/DeferredFadeIn";
import CategoryList from "./CategoryList/CategoryList";
import Products from "./ProductList/Products";
import CategoryListWrapper from "./ProductList/CategoryListWrapper";
import GoToCartWrapper from "./ProductList/GoToCartWrapper";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { setSelectedSubCategoryId } from "@/redux/features/productSlice";
import { DEFAULT_PRODUCT_FILTERS } from "@/utils/productFilters";
import { devLog } from "@/utils/devLog";
import ProductFilterFab from "@/components/productFilters/ProductFilterFab";
import LazyProductFilterSheet, {
  preloadProductFilterSheet,
} from "@/components/productFilters/LazyProductFilterSheet";
import { useProductListFilters } from "@/components/productFilters/useProductListFilters";

const ProCat = ({
  id,
  name,
  selectedCategoryIdIndex,
}: {
  id: string;
  name: string;
  selectedCategoryIdIndex: number;
}) => {
  const isCategoryFetching = false;
  const isCategoryFetchingError = false;

  const categoryData = useSelector(
    (state: RootState) => state?.category?.catgeoryData,
  );
  const getCategories = categoryData;
  const selectedSubCategory = useSelector(
    (state: RootState) => state.product.selectedSubCategoryId,
  );
  const dispatch = useDispatch();

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

  const handleOpenFilters = useCallback(() => {
    void preloadProductFilterSheet();
    openFilters();
  }, [openFilters]);

  useEffect(() => {
    devLog("[products] ProCat mount → reset selectedSubCategoryId to null", {
      id,
      name,
      selectedCategoryIdIndex,
      childrenCount: getCategories?.children?.length ?? null,
    });
    dispatch(setSelectedSubCategoryId("null"));
  }, []);

  return (
    <>
      <ScreenSafeWrapper
        showCartIcon={true}
        title={name}
        showSearchIcon={true}
        wrapperStyle={{ paddingBottom: 0, marginBottom: 0 }}
      >
        <>
          {isCategoryFetchingError ? (
            <TryAgain refetch={() => {}} />
          ) : (
            <>
              <CategoryListWrapper>
                <DeferredFadeIn delay={0}>
                  <CategoryList
                    contentContainerStyle={{ paddingHorizontal: 30 }}
                    categories={getCategories?.children}
                    isCategoryFetching={isCategoryFetching}
                    selectedCategoryIdIndex={selectedCategoryIdIndex}
                    parentCategory={{ _id: id, name: name }}
                  />
                </DeferredFadeIn>
              </CategoryListWrapper>

              <DeferredFadeIn style={{ flex: 1 }} delay={200}>
                <Products
                  isCategoryFetching={isCategoryFetching}
                  filterKey={filterKey}
                  apiParams={apiParams}
                  registerReset={registerProductsReset}
                />
              </DeferredFadeIn>
            </>
          )}
        </>
      </ScreenSafeWrapper>

      <ProductFilterFab
        filters={applied}
        onPress={handleOpenFilters}
        onClear={clearAll}
      />

      <LazyProductFilterSheet
        visible={filterVisible}
        draft={draft}
        onChange={setDraft}
        brands={brands}
        brandsLoading={brandsLoading}
        onApply={applyDraft}
        onClear={() => {
          setDraft(DEFAULT_PRODUCT_FILTERS);
          clearAll();
        }}
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
