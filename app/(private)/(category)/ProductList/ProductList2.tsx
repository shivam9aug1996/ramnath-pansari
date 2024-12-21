import { Colors } from "@/constants/Colors";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import { CartItem, Product, RootState } from "@/types/global";
import { FlashList } from "@shopify/flash-list";
import React, { memo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSelector } from "react-redux";

import ProductItem from "./ProductItem";

const ProductList2 = ({
  data,
  flatListRef,
  isFetching,
  setPaginationState,
}: {
  data: Product[];
  flatListRef: any;
}) => {
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const { data: cartData } = useFetchCartQuery(
    {
      userId,
    },
    {
      skip: !userId,
    }
  );
  console.log("product list------>", cartData);

  const renderProductItem = ({
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
      />
    );
  };

  const renderEmptyComponent = () => {
    if (isFetching) return null;
    return !isFetching && data?.products?.length == 0 ? (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No products found.</Text>
      </View>
    ) : null;
  };
  console.log("765efghjkl;", data);
  const hasNextPage = data?.currentPage < data?.totalPages;
  const totalCount = data?.totalProducts;

  // const getItemLayout = (_: any, index: number) => ({
  //   length: 277, // Estimated item height
  //   offset:
  //     index % 2 == 0
  //       ? 297 * Math.floor((index + 1) / 2)
  //       : 297 * Math.floor(index / 2),
  // });
  const fetchNextPage = () => {
    // setPage((prev) => prev + 1);
    setPaginationState((prev) => {
      return {
        ...prev,
        page: prev.page + 1,
      };
    });
  };
  const renderLoader = () => {
    // if (!hasNextPage) return null;
    console.log("876rdfghjk", data?.totalProducts);
    if (!isFetching) return null;
    return isFetching && data?.products?.length > 0 ? (
      <ActivityIndicator size="small" color={Colors.light.lightGreen} />
    ) : null;
  };

  if (!isFetching && data?.products?.length == 0) {
    return renderEmptyComponent();
  }

  return (
    <FlashList
      disableAutoLayout
      extraData={cartData}
      ref={flatListRef}
      showsVerticalScrollIndicator={false}
      numColumns={2}
      data={data?.products || []}
      keyExtractor={(item) => item._id}
      renderItem={renderProductItem}
      //ListEmptyComponent={renderEmptyComponent}
      contentContainerStyle={styles.flatList}
      estimatedItemSize={277}
      onEndReached={() => {
        console.log("hiii");
        if (isFetching) return;
        if (hasNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.1}
      ListFooterComponent={renderLoader}
    />
  );
};

export default memo(ProductList2);

const styles = StyleSheet.create({
  flatList: {
    paddingBottom: Platform.OS === "android" ? 80 : 70,
    paddingTop: 10,
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
});
