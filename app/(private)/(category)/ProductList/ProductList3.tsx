import { Colors } from "@/constants/Colors";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import { CartItem, Product, RootState } from "@/types/global";
import React, { memo, useCallback, useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  Platform,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import NotFound from "../../(result)/NotFound";
import ProductItem from "./ProductItem";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { setProductListScrollParams } from "@/redux/features/productSlice";
import { useFocusEffect } from "expo-router";

const ITEM_HEIGHT = 250

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
  headerVisible: boolean;
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
}: ProductList3Props) => {
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const { data: cartData, isLoading: isCartLoading } = useFetchCartQuery(
    { userId },
    { skip: !userId }
  );
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      // dispatch(
      //   setProductListScrollParams({
      //     isBeyondThreshold: false,
      //     direction: "up",
      //   })
      // );
    };
  }, []);

  // useFocusEffect(
  //   useCallback(() => {
      

  //     return () => {
  //       console.log("product_list3---->useFocusEffect");
  //       dispatch(
  //         setProductListScrollParams({
  //           isBeyondThreshold: false,
  //           direction: "up",
  //         })
  //       );
  //     };
  //   }, [])
  // );

  const handleScrollChange = ({
    isBeyondThreshold,
    direction,
  }: {
    isBeyondThreshold: boolean;
    direction: "up" | "down";
  }) => {
    if (!isProductsFetching) {
      dispatch(
        setProductListScrollParams({
          isBeyondThreshold,
          direction,
        })
      );
    }
  };

  const handleScroll = useScrollDirection(handleScrollChange, 800);

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

  const cartItemsMap = useMemo(() => {
    const map: Record<string, CartItem> = {};
    (cartData?.cart?.items || []).forEach((it) => {
      map[it.productId] = it;
    });
    return map;
  }, [cartData?.cart?.items]);

  const renderProductItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => {
      const cartItem = cartItemsMap[item._id];
      //console.log("cartItem", JSON.stringify(cartItem));
      return (
        <ProductItem
          key={item?._id || index}
          cartItem={cartItem}
          item={item}
          index={index}
        />
      );
    },
    [cartItemsMap]
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

  return (
    <FlatList
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
      // getItemLayout={(data, index) => ({
      //   length: ITEM_HEIGHT,
      //   offset: ITEM_HEIGHT * index,
      //   index,
      // })}
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
    //   onScroll={handleScroll}
    //  scrollEventThrottle={16}
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
