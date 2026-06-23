import { useFetchCartQuery } from "@/redux/features/cartSlice";
import { CartItem, Product, RootState } from "@/types/global";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Platform,
  FlatList,
  RefreshControl,
  ViewToken,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import NotFound from "../../(result)/NotFound";
import ProductItem from "./ProductItem";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { usePaginationSkeleton } from "@/hooks/usePaginationSkeleton";
import {
  setProductListScrollParams,
} from "@/redux/features/productSlice";
import { useFocusEffect } from "expo-router";
import ProductItemWrapper from "./ProductItemWrapper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGoToCartListPadding } from "@/contexts/DeliveryFloatContext";
import {
  PRODUCT_CARD_HEIGHT,
  PRODUCT_LIST_ITEM_SEPARATOR_HEIGHT,
  PRODUCT_LIST_MARGIN_TOP,
  PRODUCT_LIST_PADDING_BOTTOM,
  PRODUCT_LIST_PADDING_TOP,
  isProductSkeleton,
  ProductListRow,
  withPaginationSkeletons,
} from "./productListLayout";
import { ProductItemSkeleton } from "./ProductListPlaceholder";


const ITEM_HEIGHT = PRODUCT_CARD_HEIGHT;
const ESTIMATED_ITEM_HEIGHT = ITEM_HEIGHT + PRODUCT_LIST_ITEM_SEPARATOR_HEIGHT;

const ItemSeparator = () => {
  return <View style={{ height: PRODUCT_LIST_ITEM_SEPARATOR_HEIGHT }} />;
};

const getItemLayout = (_: any, index: number) => {
  // For 2 columns compute row offset (works only if item height is fixed)
  const row = Math.floor(index / 2);
  const rowHeight = ESTIMATED_ITEM_HEIGHT;
  return { length: rowHeight, offset: row * rowHeight, index };
};


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
}

interface CartData {
  cart?: {
    items?: CartItem[];
  };
}

const ProductList3 = ({
  data,
  flatListRef,
  setPaginationState,
  isProductsFetching,
  isProductsLoading,
  paginationState,
  refetch,
}: ProductList3Props) => {
  const goToCartListPadding = useGoToCartListPadding();
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const syncedProductOverrides = useSelector(
    (state: RootState) => state.product.syncedProductOverrides,
  );
  const { data: cartData, isLoading: isCartLoading } = useFetchCartQuery(
    { userId },
    { skip: !userId }
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const visibleIdsRef = useRef(visibleIds);
  // const onViewableItemsChanged = useRef(
  //   ({ viewableItems }: { viewableItems: ViewToken[] }) => {
  //     // Add viewable items to set so their images/components can load
  //     setVisibleIds((prev) => {
  //       const next = new Set(prev);
  //       viewableItems.forEach((v) => {
  //         console.log("v5678---------->",v);
  //         if (v.item && v.item._id) next.add(v.item._id);
  //       });
  //       // Optionally: remove ids not visible if you want to free memory,
  //       // but keeping them prevents repeated reloading while scrolling back.
  //       return next;
  //     });
  //   }
  // ).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visibleNow = new Set<string>();
      viewableItems.forEach((v) => {
        const id = v?.item?._id;
        if (typeof id === "string" && id.length) visibleNow.add(id);
      });
      setVisibleIds(visibleNow);
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 1, // consider visible when 20% is on screen
    waitForInteraction: false,
  }).current;
  visibleIdsRef.current = visibleIds;
  const dispatch = useDispatch();

  const hasNextPage = data?.currentPage < data?.totalPages;

  const { showSkeleton: showPaginationSkeleton, beginPaging } =
    usePaginationSkeleton({
      isFetching: isProductsFetching,
      page: paginationState.page,
      hasItems: (data?.products?.length ?? 0) > 0,
      hasNextPage,
    });

  const isLoadingMoreRef = useRef(showPaginationSkeleton);
  isLoadingMoreRef.current = showPaginationSkeleton;

  const onChromeVisibilityChange = useCallback(
    (hidden: boolean) => {
      // Content growth at the list tail (pagination skeletons) can fire spurious
      // scroll-up events — keep chrome hidden until the user explicitly scrolls up.
      if (!hidden && isLoadingMoreRef.current) return;
      dispatch(setProductListScrollParams({ shouldHideChrome: hidden }));
    },
    [dispatch],
  );

  const { handleScroll, reset: resetScrollChrome } = useHideOnScroll(
    onChromeVisibilityChange,
  );

  useFocusEffect(
    useCallback(() => {
      resetScrollChrome();
      return () => resetScrollChrome();
    }, [resetScrollChrome]),
  );

  useEffect(() => {
    resetScrollChrome();
  }, [paginationState.categoryId, resetScrollChrome]);

  const listData = useMemo(
    () => withPaginationSkeletons(data?.products, showPaginationSkeleton),
    [data?.products, showPaginationSkeleton],
  );

  // const renderProductItem = useCallback(
  //   ({ item, index }: { item: Product; index: number }) => {
  //     return <ProductItemWrapper item={item} index={index} />;
  //   },
  //   []
  // );

  const cartItemsMap = useMemo(() => {
   // console.log("cartDatashivam---------->");
    const map: Record<string, CartItem> = {};
    (cartData?.cart?.items || []).forEach((it) => {
      const id = String(it.productDetails?._id ?? it.productId ?? "");
      if (id) map[id] = it;
    });
    return map;
  }, [cartData?.cart?.items]);

  const renderProductItem = useCallback(
    ({ item, index }: { item: ProductListRow; index: number }) => {
      if (isProductSkeleton(item)) {
        return <ProductItemSkeleton index={index} />;
      }

      const override = syncedProductOverrides[item._id];
      const mergedItem = override ? { ...item, ...override } : item;
      const cartItem = cartItemsMap[item._id];
      const isVisible = visibleIds.has(item._id);
      return (
        <ProductItemWrapper
          item={mergedItem}
          index={index}
          quantity={cartItem?.quantity ?? 0}
          isVisible={isVisible}
        />
      );
    },
    [cartItemsMap, visibleIds, syncedProductOverrides],
  );

  const renderEmptyComponent = useCallback(() => {
    if (
      isProductsLoading ||
      (isProductsFetching && data?.products?.length === 0)
    )
      return null;
    return (
      <View
        style={{
          opacity: isProductsFetching && paginationState?.page === 1 ? 0.6 : 1,
          pointerEvents:
            isProductsFetching && paginationState?.page === 1 ? "none" : "auto",
        }}
      >
        <NotFound
          title="No Items Available"
          subtitle="Browse different categories for more options."
        />
      </View>
    );
  }, [
    isProductsFetching,
    isProductsLoading,
    data?.products?.length,
    paginationState?.page,
  ]);

  const fetchNextPage = useCallback(() => {
    setPaginationState((prevState) => ({
      ...prevState,
      page: prevState.page + 1,
    }));
  }, [setPaginationState]);

  // const refreshProducts = useCallback(async() => {
  //   const key = `products-${paginationState.categoryId}-`
  //   const keys = await AsyncStorage.getAllKeys();
  //   console.log("keys",keys);
  //   keys.forEach(async(k: string) => {
  //     if (k.startsWith(key)) {
  //       await AsyncStorage.removeItem(k);
  //     }
  //   });
  //   const keys2 = await AsyncStorage.getAllKeys();
  //   console.log("keys",keys2);
  //   refetch()
  //   // dispatch(productApi.util.resetApiState())
  //   setPaginationState((prevState) => {
  //     return {
  //       ...prevState,
  //       page: 1,
  //     }
  //   });
  // }, [paginationState.categoryId]);

  const handleRefresh = async() => {
    console.log("handleRefresh765434567890");
    setIsRefreshing(true);
    await refetch()
    setIsRefreshing(false);
  };
  

  return (
    <FlatList
      key={paginationState.categoryId ?? "product-list"}
   //refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}

      // onRefresh={refetch}
      // refreshing={isRefreshing}
    //getItemLayout={getItemLayout} // Disabled: causes glitches with numColumns due to variable item heights
      bounces={Platform.OS === "android" ? false : true}
      initialNumToRender={6}
      maxToRenderPerBatch={showPaginationSkeleton ? 8 : 2}
      windowSize={showPaginationSkeleton ? 7 : 5}
      updateCellsBatchingPeriod={100}  // ms between rendering batches (higher = smoother)
      numColumns={2}
      removeClippedSubviews={false}
      ItemSeparatorComponent={ItemSeparator}
      ref={flatListRef}
      showsVerticalScrollIndicator={false}
      
      data={listData}
      extraData={showPaginationSkeleton}
      keyExtractor={(item) => item._id}
      renderItem={renderProductItem}
      ListEmptyComponent={renderEmptyComponent}
      contentContainerStyle={[
        styles.flatList,
        {
          opacity: isProductsFetching && paginationState?.page === 1 ? 0.6 : 1,
          pointerEvents:
            isProductsFetching && paginationState?.page === 1 ? "none" : "auto",
          paddingBottom:
            PRODUCT_LIST_PADDING_BOTTOM + goToCartListPadding,
        },
      ]}
      onEndReached={() => {
        if (isProductsFetching || !hasNextPage) return;
        beginPaging();
        fetchNextPage();
      }}
      onEndReachedThreshold={0.35}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      scrollEventThrottle={16}
      onScroll={handleScroll}
      style={{ marginTop: PRODUCT_LIST_MARGIN_TOP }}
    />
  );
};

export default memo(ProductList3);

const styles = StyleSheet.create({
  flatList: {
    paddingTop: PRODUCT_LIST_PADDING_TOP,
  },
});
