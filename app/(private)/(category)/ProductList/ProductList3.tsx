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
  FlatList,
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
  isProductsLoading,
  paginationState,
}: {
  data: Product[];
  flatListRef: any;
  setPaginationState: any;
  isProductsFetching: boolean;
  isProductsLoading: boolean;
}) => {
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
  console.log("product list------>");

  const hasNextPage = data?.currentPage < data?.totalPages;
  const totalCount = data?.totalResults;
  const renderLoader = () => {
    //if (!hasNextPage) return null;
    if (
      isProductsLoading ||
      (isProductsFetching && data?.products?.length == 0)
    )
      return;
    return hasNextPage ? (
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
        isCartLoading={isCartLoading}
        isProductsFetching={isProductsFetching}
        paginationState={paginationState}
      />
    );
  };

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

  return (
    <FlatList
      initialNumToRender={4}
      ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
      //disableAutoLayout
      extraData={cartData}
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
      ListFooterComponentStyle={{ paddingTop: 15 }}
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
  productItemContainer: {
    flex: 1,
    margin: 5,
  },
});
