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
import NotFound from "../../(result)/NotFound";
import Pagination from "./Pagination";

import ProductItem from "./ProductItem";

const ProductList3 = ({
  data,
  flatListRef,
  setPaginationState,
  isProductsFetching,
}: {
  data: Product[];
  flatListRef: any;
  setPaginationState: any;
  isProductsFetching: boolean;
}) => {
  const [page, setPage] = useState(1);

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

  const hasNextPage = data?.currentPage < data?.totalPages;
  const totalCount = data?.totalResults;

  const renderLoader = () => {
    //if (!hasNextPage) return null;
    return isProductsFetching ? (
      <ActivityIndicator size="large" color={Colors.light.lightGreen} />
    ) : null;
  };

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

  const renderEmptyComponent = () => (
    <NotFound
      title="No Items Available"
      subtitle={`Browse different categories for more options.`}
    />
  );

  const fetchNextPage = () => {
    setPaginationState((prevState) => ({
      ...prevState,
      page: prevState.page + 1,
    }));
  };

  return (
    <FlashList
      extraData={cartData}
      ref={flatListRef}
      showsVerticalScrollIndicator={false}
      numColumns={2}
      data={data?.products || []}
      keyExtractor={(item) => item._id}
      renderItem={renderProductItem}
      ListEmptyComponent={renderEmptyComponent}
      contentContainerStyle={styles.flatList}
      estimatedItemSize={277}
      onEndReached={() => {
        if (isProductsFetching) return;
        if (hasNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.1}
      ListFooterComponent={renderLoader}
    />
  );
};

export default memo(ProductList3);

const styles = StyleSheet.create({
  flatList: {
    // paddingBottom: Platform.OS === "android" ? 80 : 70,
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
