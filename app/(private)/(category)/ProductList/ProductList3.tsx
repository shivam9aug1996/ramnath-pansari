import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Platform,
  FlatList,
  RefreshControl,
  ListRenderItemInfo,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

import { useFetchCartQuery } from "@/redux/features/cartSlice";
import { CartItem, Product, RootState } from "@/types/global";
import NotFound from "../../(result)/NotFound";
import ProductItemWrapper from "./ProductItemWrapper";
import { useGoToCartListPadding } from "@/contexts/DeliveryFloatContext";
import {
  PRODUCT_CARD_HEIGHT,
  PRODUCT_LIST_MARGIN_TOP,
  PRODUCT_LIST_PADDING_BOTTOM,
  PRODUCT_LIST_PADDING_TOP,
  isProductSkeleton,
  ProductListRow,
  buildProductListData,
  GO_TO_CART_ESTIMATED_HEIGHT,
} from "./productListLayout";
import {
  ProductItemSkeletonStatic,
  ProductPaginationSkeleton,
} from "./ProductListPlaceholder";
import { clearVisibleProductIds } from "./productVisibilityStore";
import { setVisibleIds } from "@/redux/features/productSlice";

interface PaginationState {
  categoryId: string | null;
  page: number;
  reset: boolean;
}

interface ProductList3Props {
  data: {
    products: Product[];
    currentPage: number;
    totalPages: number;
    totalResults: number;
  };
  flatListRef: React.RefObject<FlatList>;
  setPaginationState: (
    updater: (prev: PaginationState) => PaginationState
  ) => void;
  isProductsFetching: boolean;
  isProductsLoading: boolean;
  paginationState: PaginationState;
  showInitialSkeleton?: boolean;
  handleRefresh1?: () => void;
  listKeySuffix?: string;
  refetch?: () => void;
}

const ProductList3 = ({
  data,
  flatListRef,
  setPaginationState,
  isProductsFetching,
  isProductsLoading,
  paginationState,
  refetch,
  showInitialSkeleton = false,
  handleRefresh1 = () => {},
  listKeySuffix = "default",
}: ProductList3Props) => {
  const dispatch = useDispatch();
  const scrollEndedRef = useRef(0);
  const pagingLockRef = useRef(false);
  const goToCartListPadding = useGoToCartListPadding();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const syncedProductOverrides = useSelector(
    (state: RootState) => state.product.syncedProductOverrides,
  );

  const { data: cartData } = useFetchCartQuery(
    { userId },
    { skip: !userId },
  );

  const isRefreshingFirstPage =
    isProductsFetching && paginationState.page === 1;

  const bottomPad =
    PRODUCT_LIST_PADDING_BOTTOM +
    Math.max(goToCartListPadding, GO_TO_CART_ESTIMATED_HEIGHT);

  const listContentContainerStyle = useMemo(
    () => [
      styles.flatList,
      isRefreshingFirstPage && !showInitialSkeleton && styles.listRefreshing,
      { paddingBottom: bottomPad },
    ],
    [isRefreshingFirstPage, goToCartListPadding, showInitialSkeleton, bottomPad],
  );

  const hasNextPage = data?.currentPage < data?.totalPages;

  useEffect(() => {
    clearVisibleProductIds();
  }, [paginationState.categoryId, listKeySuffix]);

  useEffect(() => {
    dispatch(setVisibleIds([]));
  }, [dispatch]);

  const listData = useMemo(
    () =>
      buildProductListData(data?.products, {
        showInitialSkeleton,
      }),
    [data?.products, showInitialSkeleton],
  );

  const cartItemsMap = useMemo(() => {
    const map: Record<string, CartItem> = {};
    const items = cartData?.cart?.items || [];
    for (const it of items) {
      const id = String(it.productDetails?._id ?? it.productId ?? "");
      if (id) map[id] = it;
    }
    return map;
  }, [cartData?.cart?.items]);

  const renderProductItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ProductListRow>) => {
      if (isProductSkeleton(item)) {
        return <ProductItemSkeletonStatic index={index} />;
      }

      const override = syncedProductOverrides[item._id];
      const mergedItem = override ? { ...item, ...override } : item;
      const cartItem = cartItemsMap[item._id];

      return (
        <ProductItemWrapper
          item={mergedItem}
          index={index}
          quantity={cartItem?.quantity ?? 0}
        />
      );
    },
    [cartItemsMap, syncedProductOverrides],
  );

  const renderListFooter = useCallback(() => {
    if (showInitialSkeleton || !hasNextPage) return null;
    return (
      <View>
        <ProductPaginationSkeleton />
      </View>
    );
  }, [showInitialSkeleton, hasNextPage]);

  const renderEmptyComponent = useCallback(() => {
    if (
      showInitialSkeleton ||
      isProductsLoading ||
      (isProductsFetching && (data?.products?.length ?? 0) === 0)
    ) {
      return null;
    }

    const isFading = isProductsFetching && paginationState.page === 1;

    return (
      <View
        style={[
          styles.emptyContainer,
          isFading && styles.emptyContainerFaded,
        ]}
      >
        <NotFound
          title="No Items Available"
          subtitle="Browse different categories for more options."
        />
      </View>
    );
  }, [
    showInitialSkeleton,
    isProductsFetching,
    isProductsLoading,
    data?.products?.length,
    paginationState.page,
  ]);

  const fetchNextPage = useCallback(() => {
    if (pagingLockRef.current) return;
    pagingLockRef.current = true;
    setPaginationState((prevState) => ({
      ...prevState,
      page: prevState.page + 1,
      reset: false,
    }));
  }, [setPaginationState]);

  useEffect(() => {
    if (!isProductsFetching) {
      pagingLockRef.current = false;
    }
  }, [isProductsFetching]);

  const handleEndReached = useCallback(async () => {
    if (showInitialSkeleton || !hasNextPage || isProductsFetching || pagingLockRef.current) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
    fetchNextPage();
  }, [hasNextPage, isProductsFetching, fetchNextPage, showInitialSkeleton]);

  const handleRefresh = useCallback(async () => {
    if (!refetch) return;
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const onMomentumScrollEnd = useCallback(() => {
    scrollEndedRef.current = 1;
  }, []);

  const onMomentumScrollBegin = useCallback(() => {
    scrollEndedRef.current = 2;
  }, []);

  const keyExtractor = useCallback((item: ProductListRow) => item._id, []);

  return (
    <FlatList
      key={`${paginationState.categoryId ?? "product-list"}-${listKeySuffix}`}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh1 || handleRefresh}
        />
      }
      bounces={Platform.OS !== "android"}
      initialNumToRender={6}
      numColumns={2}
      removeClippedSubviews={false}
      ref={flatListRef}
      showsVerticalScrollIndicator={false}
      scrollEnabled={!showInitialSkeleton}
      data={listData}
      ListFooterComponent={renderListFooter}
      extraData={cartItemsMap}
      keyExtractor={keyExtractor}
      renderItem={renderProductItem}
      ListEmptyComponent={renderEmptyComponent}
      ListFooterComponentStyle={hasNextPage ? styles.listFooter : undefined}
      contentContainerStyle={listContentContainerStyle}
      onEndReached={showInitialSkeleton ? undefined : handleEndReached}
      onEndReachedThreshold={0.35}
      onMomentumScrollEnd={onMomentumScrollEnd}
      onMomentumScrollBegin={onMomentumScrollBegin}
      onScrollBeginDrag={onMomentumScrollBegin}
      onScrollEndDrag={onMomentumScrollEnd}
      style={styles.list}
    />
  );
};

export default memo(ProductList3);

const styles = StyleSheet.create({
  list: {
    marginTop: PRODUCT_LIST_MARGIN_TOP,
  },
  flatList: {
    paddingTop: PRODUCT_LIST_PADDING_TOP,
  },
  listRefreshing: {
    opacity: 0.6,
    pointerEvents: "none",
  },
  listFooter: {
    height: 200,
  },
  emptyContainer: {
    opacity: 1,
  },
  emptyContainerFaded: {
    opacity: 0.6,
    pointerEvents: "none",
  },
});