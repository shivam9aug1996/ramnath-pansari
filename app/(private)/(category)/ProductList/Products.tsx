import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { View, FlatList, StyleSheet, Platform } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "expo-router";

import {
  productApi,
  setResetPagination,
  useFetchProductsQuery,
  useLazyFetchProductsQuery,
} from "@/redux/features/productSlice";
import { setSubCategoryActionClicked } from "@/redux/features/categorySlice";
import { RootState, Product } from "@/types/global";
import { scrollToTop } from "./utils";
import TryAgain from "../CategoryList/TryAgain";
import ProductList3 from "./ProductList3";
import { cleanAllProductCache } from "@/utils/utils";
import { clearCategoryProductCacheFromMemoryAndAsyncStorage } from "@/utils/productCache";
import { devLog } from "@/utils/devLog";
import AsyncRouteLoader from "@/components/AsyncRouteLoader";

interface ProductsProps {
  isCategoryFetching: boolean;
  filterKey?: string;
  apiParams?: Record<string, string | boolean | number>;
  registerReset?: (fn: () => void) => void;
}

interface PaginationState {
  categoryId: string | null;
  page: number;
  reset: boolean;
  refreshKey?: number;
}

const Products = ({
  isCategoryFetching,
  filterKey = "default",
  apiParams = {},
  registerReset,
}: ProductsProps) => {
  const dispatch = useDispatch();

  const subCategoryActionClicked = useSelector(
    (state: RootState) => state.category.subCategoryActionClicked,
  );
  const selectedSubCategory = useSelector(
    (state: RootState) => state.product.selectedSubCategoryId,
  );
  const selectedCategoryClicked = useSelector(
    (state: RootState) => state.product.selectedCategoryClicked,
  );
  const resetPagination = useSelector(
    (state: RootState) => state.product?.resetPagination,
  );

  const [paginationState, setPaginationState] = useState<PaginationState>({
    categoryId: selectedSubCategory?._id || null,
    page: 1,
    reset: false,
  });

  const flatListRef = useRef<FlatList>(null);

  const resetToPageOne = useCallback(() => {
    scrollToTop(flatListRef);
    setPaginationState((prev) => ({
      ...prev,
      page: 1,
      reset: true,
      refreshKey: Date.now(),
    }));
  }, []);

  useEffect(() => {
    registerReset?.(resetToPageOne);
  }, [registerReset, resetToPageOne]);

  // When parent filter fingerprint changes, reset pagination
  const prevFilterKeyRef = useRef(filterKey);
  useEffect(() => {
    if (prevFilterKeyRef.current === filterKey) return;
    prevFilterKeyRef.current = filterKey;
    resetToPageOne();
  }, [filterKey, resetToPageOne]);

  const activeCategoryId = selectedSubCategory?._id ?? null;

  const {
    data,
    isFetching: isProductsFetching,
    isError: isProductError,
    isLoading: isProductsLoading,
  } = useFetchProductsQuery(
    {
      categoryId: paginationState.categoryId,
      page: paginationState.page,
      limit: 10,
      reset: paginationState.reset,
      refreshKey: paginationState.refreshKey,
      filterKey,
      ...apiParams,
    },
    {
      skip:
        !paginationState.categoryId ||
        paginationState.page < 1 ||
        paginationState.categoryId === "null",
    },
  );

  const [fetchProducts] = useLazyFetchProductsQuery();

  // Handle category changes
  useEffect(() => {
    if (!activeCategoryId || activeCategoryId === "null") {
      return;
    }
    scrollToTop(flatListRef);
    setPaginationState((prev) => ({
      ...prev,
      categoryId: activeCategoryId,
      page: 1,
      reset: true,
    }));
    dispatch(setSubCategoryActionClicked(false));
  }, [activeCategoryId, dispatch]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      requestAnimationFrame(() => {
        if (resetPagination?.status && data?.products && isMounted) {
          const id = resetPagination?.item?._id;
          const index = data.products.findIndex(
            (item: Product) => item._id === id,
          );
          if (index === -1) return;

          const page = Math.ceil((index + 1) / 10);

          fetchProducts(
            {
              categoryId: activeCategoryId,
              page,
              limit: 10,
              filterKey,
              ...apiParams,
            },
            false,
          )
            ?.unwrap()
            ?.finally(() => {
              if (isMounted) {
                dispatch(setResetPagination({ item: null, status: false }));
              }
            });
        }
      });

      return () => {
        isMounted = false;
      };
    }, [
      resetPagination?.status,
      resetPagination?.item?._id,
      data?.products,
      activeCategoryId,
      dispatch,
      filterKey,
      apiParams,
      fetchProducts,
    ]),
  );

  const handleRefetchProducts = useCallback(async () => {
    await cleanAllProductCache();
    setPaginationState((prev) => ({
      ...prev,
      page: 1,
    }));
    dispatch(productApi.util.resetApiState());
  }, [dispatch]);

  const handleRefetchProductsForCategory = useCallback(async () => {
    if (!activeCategoryId) return;
    await clearCategoryProductCacheFromMemoryAndAsyncStorage(activeCategoryId);
    setPaginationState((prev) => ({
      ...prev,
      categoryId: activeCategoryId,
      page: 1,
      reset: true,
      refreshKey: Date.now(),
    }));
  }, [activeCategoryId]);

  const isCategoryOutOfSync =
    activeCategoryId != null && paginationState.categoryId !== activeCategoryId;
  const hasProductsToShow = (data?.products?.length ?? 0) > 0;

  const showInitialSkeleton =
    isCategoryFetching ||
    !paginationState.categoryId ||
    isCategoryOutOfSync ||
    (!hasProductsToShow &&
      (isProductsLoading ||
        (isProductsFetching && paginationState.page === 1)));

  useEffect(() => {
    devLog("[products] query state", {
      paginationCategoryId: paginationState.categoryId,
      selectedSubCategoryId: activeCategoryId,
      page: paginationState.page,
      reset: paginationState.reset,
      filterKey,
      productCount: data?.products?.length ?? null,
      totalResults: data?.totalResults ?? null,
      isProductsLoading,
      isProductsFetching,
      isProductError,
      isCategoryOutOfSync,
      showInitialSkeleton,
      hasProductsToShow,
    });
  }, [
    paginationState,
    activeCategoryId,
    data,
    isProductsLoading,
    isProductsFetching,
    isProductError,
    isCategoryOutOfSync,
    showInitialSkeleton,
    hasProductsToShow,
    filterKey,
  ]);

  const showOverlaySpinner =
    subCategoryActionClicked ||
    (isProductsFetching &&
      paginationState.page === 1 &&
      hasProductsToShow &&
      !showInitialSkeleton);

  if (isProductError) {
    return <TryAgain refetch={handleRefetchProducts} />;
  }

  return (
    <View style={styles.container}>
      {showOverlaySpinner && (
        <View style={styles.overlay}>
          <AsyncRouteLoader
            style={styles.loaderStyle}
            message=""
            showBrand={false}
          />
        </View>
      )}

      <ProductList3
        handleRefresh1={handleRefetchProductsForCategory}
        refetch={handleRefetchProducts}
        flatListRef={flatListRef}
        data={data}
        setPaginationState={setPaginationState}
        isProductsFetching={
          isProductsFetching ||
          selectedCategoryClicked ||
          subCategoryActionClicked
        }
        isProductsLoading={isProductsLoading}
        paginationState={paginationState}
        showInitialSkeleton={showInitialSkeleton}
        listKeySuffix={filterKey}
      />
    </View>
  );
};

export default memo(Products);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...(Platform.OS === "web" ? { height: "100%" } : {}),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loaderStyle: {
    width: "100%",
    backgroundColor: "transparent",
  },
});