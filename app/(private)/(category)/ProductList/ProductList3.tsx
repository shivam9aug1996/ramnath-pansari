import { Colors } from "@/constants/Colors";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import { CartItem, Product, RootState } from "@/types/global";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Platform,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ViewToken,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import NotFound from "../../(result)/NotFound";
import ProductItem from "./ProductItem";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import {
  productApi,
  setProductListScrollParams,
} from "@/redux/features/productSlice";
import { useFocusEffect } from "expo-router";
import ProductItemWrapper from "./ProductItemWrapper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDeliveryFloatInset } from "@/contexts/DeliveryFloatContext";
import {
  PRODUCT_CARD_HEIGHT,
  PRODUCT_LIST_MARGIN_TOP,
  PRODUCT_LIST_PADDING_BOTTOM,
  PRODUCT_LIST_PADDING_TOP,
} from "./productListLayout";


const ITEM_HEIGHT = PRODUCT_CARD_HEIGHT;
const ITEM_SEPARATOR_HEIGHT = 20;
const ESTIMATED_ITEM_HEIGHT = ITEM_HEIGHT + ITEM_SEPARATOR_HEIGHT;

const ItemSeparator = () => {
  return <View style={{ height: 20 }} />;
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
  const deliveryFloatInset = useDeliveryFloatInset();
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
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

  const renderLoader = useCallback(() => {
    if (
      isProductsLoading ||
      (isProductsFetching && data?.products?.length === 0)
    )
      return null;
    return hasNextPage ? (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color={Colors.light.lightGreen} />
        <Text style={styles.loaderText}>Loading more...</Text>
      </View>
    ) : null;
  }, [
    isProductsLoading,
    isProductsFetching,
    data?.products?.length,
    hasNextPage,
  ]);

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
      map[it.productId] = it;
    });
    return map;
  }, [cartData?.cart?.items]);

  const renderProductItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => {
      const cartItem = cartItemsMap[item._id];
      const isVisible = visibleIds.has(item._id);
      return (
        <ProductItemWrapper
          item={item}
          index={index}
          quantity={cartItem?.quantity ?? 0}
          isVisible={isVisible}
        />
      );
    },
    [cartItemsMap,visibleIds] // ✅ depends on the cart mapping
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
   //refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}

      // onRefresh={refetch}
      // refreshing={isRefreshing}
    //getItemLayout={getItemLayout} // Disabled: causes glitches with numColumns due to variable item heights
      bounces={Platform.OS === "android" ? false : true}
      initialNumToRender={6}            // render ~visible items on first frame
      maxToRenderPerBatch={2}          // how many new items to render per batch
      windowSize={5}                   // number of viewports to keep rendered (smaller = less work)
      updateCellsBatchingPeriod={100}  // ms between rendering batches (higher = smoother)
      numColumns={2}
      removeClippedSubviews={true}  
      ItemSeparatorComponent={ItemSeparator}
      ref={flatListRef}
      showsVerticalScrollIndicator={false}
      
      data={data?.products || []}
      keyExtractor={(item) => item._id}
      renderItem={renderProductItem}
      ListEmptyComponent={renderEmptyComponent}
      contentContainerStyle={[
        styles.flatList,
        {
          opacity: isProductsFetching && paginationState?.page === 1 ? 0.6 : 1,
          pointerEvents:
            isProductsFetching && paginationState?.page === 1 ? "none" : "auto",
          paddingBottom: PRODUCT_LIST_PADDING_BOTTOM + deliveryFloatInset,
        },
      ]}
      onEndReached={() => {
        if (isProductsFetching) return;
        if (hasNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.1}
      ListFooterComponent={renderLoader}
      ListFooterComponentStyle={{ paddingTop: 15, marginVertical: 15 }}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      style={{ marginTop: PRODUCT_LIST_MARGIN_TOP }}
    />
  );
};

export default memo(ProductList3);

const styles = StyleSheet.create({
  flatList: {
    paddingTop: PRODUCT_LIST_PADDING_TOP,
  },
  loaderContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  loaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.light.lightGreen,
  },
});
