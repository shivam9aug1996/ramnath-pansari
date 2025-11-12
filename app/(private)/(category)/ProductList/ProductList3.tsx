import { Colors } from "@/constants/Colors";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import { CartItem, Product, RootState } from "@/types/global";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Platform,
  ActivityIndicator,
  FlatList,
  RefreshControl,
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

const ITEM_HEIGHT = 250;

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
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const { data: cartData, isLoading: isCartLoading } = useFetchCartQuery(
    { userId },
    { skip: !userId }
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dispatch = useDispatch();
console.log("uyewasdfghgfd",JSON.stringify(data))

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
    console.log("cartDatashivam---------->");
    const map: Record<string, CartItem> = {};
    (cartData?.cart?.items || []).forEach((it) => {
      map[it.productId] = it;
    });
    return map;
  }, [cartData?.cart?.items]);

  const renderProductItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => {
      const cartItem = cartItemsMap[item._id];
      return (
        <ProductItemWrapper
          item={item}
          index={index}
          quantity={cartItem?.quantity ?? 0}
        />
      );
    },
    [cartItemsMap] // ✅ depends on the cart mapping
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
  console.log("data76543456kkk7890");

  return (
    <FlatList
   //refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}

      // onRefresh={refetch}
      // refreshing={isRefreshing}
      bounces={Platform.OS === "android" ? false : true}
      initialNumToRender={2}
      ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
      ref={flatListRef}
      showsVerticalScrollIndicator={false}
      numColumns={2}
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
        },
      ]}
      onEndReached={() => {
        if (isProductsFetching) return;
        if (hasNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.1}
      ListFooterComponent={renderLoader}
      ListFooterComponentStyle={{ paddingTop: 15, marginVertical: 15 }}
      style={{ marginTop: 20 }}
    />
  );
};

export default memo(ProductList3);

const styles = StyleSheet.create({
  flatList: {
    paddingTop: 170,
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
