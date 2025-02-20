import { Colors } from "@/constants/Colors";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import { CartItem, Product, RootState } from "@/types/global";
import { FlashList } from "@shopify/flash-list";
import React, { memo, useCallback, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Platform,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useSelector } from "react-redux";
import NotFound from "../../(result)/NotFound";
import Pagination from "./Pagination";

import ProductItem from "./ProductItem";
import {
  Easing,
  useAnimatedScrollHandler,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { debounce, throttle } from "lodash";

const ProductList3 = ({
  data,
  flatListRef,
  setPaginationState,
  isProductsFetching,
  isProductsLoading,
  paginationState,
  headerVisible,
}: {
  data: Product[];
  flatListRef: any;
  setPaginationState: any;
  isProductsFetching: boolean;
  isProductsLoading: boolean;
}) => {
  const lastScrollY = useSharedValue(0);
  const SCROLL_THRESHOLD = 15;

  const [page, setPage] = useState(1);

  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const { data: cartData, isLoading: isCartLoading } = useFetchCartQuery(
    {
      userId,
    },
    {
      skip: !userId,
    }
  );
  console.log("product list------>", data);

  const hasNextPage = data?.currentPage < data?.totalPages;
  const totalCount = data?.totalResults;

  const renderLoader = useCallback(() => {
    //if (!hasNextPage) return null;
    if (
      isProductsLoading ||
      (isProductsFetching && data?.products?.length == 0)
    )
      return;
    return hasNextPage ? (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color={Colors.light.lightGreen} />
        <Text style={styles.loaderText}>Loading more...</Text>
      </View>
    ) : null;
  }, [isProductsLoading,isProductsFetching,data?.products?.length,hasNextPage]);

  // const renderProductItem = ({
  //   item,
  //   index,
  // }: {
  //   item: Product;
  //   index: number;
  // }) => {
  //   const cartItem = cartData?.cart?.items?.find(
  //     (it: CartItem) => it.productId === item._id
  //   );

  //   return (
  //     <ProductItem
  //       key={item?._id || index}
  //       cartItem={cartItem}
  //       item={item}
  //       index={index}
  //       isCartLoading={isCartLoading}
  //       isProductsFetching={isProductsFetching}
  //       paginationState={paginationState}
  //     />
  //   );
  // };

  // ... existing code ...

  const renderProductItem = useCallback(({
    item,
    index,
  }: {
    item: Product;
    index: number;
  }) => {
    const cartItem = cartData?.cart?.items?.find(
      (it: CartItem) => it.productId === item._id
    );

    return (
      <ProductItem
        key={item?._id || index}
        cartItem={cartItem}
        item={item}
        index={index}
        isCartLoading={isCartLoading}
        isProductsFetching={isProductsFetching}
        paginationState={paginationState}
      />
    );
  }, [cartData, isCartLoading, isProductsFetching, paginationState]);

  // ... existing code ...

  const renderEmptyComponent = () => {
    // if (
    //   isProductsLoading ||
    //   (isProductsFetching && data?.products?.length == 0)
    // )
    //   return null;
    return (
      <View
        style={{
          opacity: isProductsFetching && paginationState?.page == 1 ? 0.6 : 1,
          pointerEvents:
            isProductsFetching && paginationState?.page == 1 ? "none" : "auto",
        }}
      >
        <NotFound
          title="No Items Available"
          subtitle={`Browse different categories for more options.`}
        />
      </View>
    );
  };

  const fetchNextPage = () => {
    setPaginationState((prevState) => ({
      ...prevState,
      page: prevState.page + 1,
    }));
  };

  let lastOffset = 0;

  const debouncedScroll = useMemo(
    () =>
      throttle((event) => {
        if (event.nativeEvent) {
          const currentOffset = event.nativeEvent.contentOffset.y;
          console.log("currentOffset", currentOffset);
          const contentHeight = event.nativeEvent.contentSize.height;
          const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;

          if (
            scrollViewHeight + currentOffset >= contentHeight - 10 &&
            hasNextPage
          ) {
            headerVisible.value = 0;
            return;
          }

          // Show header when scrolling up or at top
          if (currentOffset < 200 || currentOffset < lastOffset) {
            headerVisible.value = 1;
          }
          // Hide header when scrolling down
          else if (currentOffset > lastOffset && currentOffset > 10) {
            headerVisible.value = 0;
          }

          lastOffset = currentOffset;
        }
      }, 500), // 200ms debounce time
    [hasNextPage]
  );

  const handleScroll = useCallback(
    (event) => {
      event?.persist();
      debouncedScroll(event);
    },
    [debouncedScroll]
  );

  // const handleScroll = useCallback((event) => {
  //   debounce(
  //     (event) => {
  //       const currentOffset = event.nativeEvent.contentOffset.y;
  //       console.log("currentOffset", currentOffset);
  //       const contentHeight = event.nativeEvent.contentSize.height; // Total height of the content
  //       const scrollViewHeight = event.nativeEvent.layoutMeasurement.height; // Height of the visible area

  //       if (
  //         scrollViewHeight + currentOffset >= contentHeight - 10 &&
  //         hasNextPage
  //       ) {
  //         headerVisible.value = 0;
  //         return;
  //       }

  //       // Show header when scrolling up or at top
  //       if (currentOffset < 200 || currentOffset < lastOffset) {
  //         headerVisible.value = 1;
  //       }
  //       // Hide header when scrolling down
  //       else if (currentOffset > lastOffset && currentOffset > 10) {
  //         headerVisible.value = 0;
  //       }

  //       lastOffset = currentOffset;
  //     },
  //     2000,
  //     event
  //   );
  // }, []);



  return (
    <FlatList
    bounces={Platform.OS === "android" ? false : true}
      //getItemLayout={getItemLayout}
      // bounces={false}
      //removeClippedSubviews={true}
     // onScroll={handleScroll}
     // scrollEventThrottle={32}
       initialNumToRender={5}
      // maxToRenderPerBatch={4}
     // windowSize={10}
      ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
      //disableAutoLayout
      // extraData={cartData}
      ref={flatListRef}
      showsVerticalScrollIndicator={false}
      numColumns={2}
      data={data?.products || []}
      keyExtractor={(item) => item._id}
      renderItem={renderProductItem}
      ListEmptyComponent={renderEmptyComponent}
      contentContainerStyle={styles.flatList}
      //  estimatedItemSize={277}
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
    // paddingBottom: Platform.OS === "android" ? 80 : 70,
    paddingTop: 170,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "grey",
  },
  productItemContainer: {
    flex: 1,
    margin: 5,
  },
  loaderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  loaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.light.lightGreen,
  },
});
