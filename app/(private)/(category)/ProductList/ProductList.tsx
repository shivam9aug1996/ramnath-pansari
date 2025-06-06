import { useFetchCartQuery } from "@/redux/features/cartSlice";
import { CartItem, Product, RootState } from "@/types/global";
import { FlashList } from "@shopify/flash-list";
import React, { memo } from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import { useSelector } from "react-redux";

import ProductItem from "./ProductItem";

const ProductList = ({
  data,
  flatListRef,
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

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No products found.</Text>
    </View>
  );

  // const getItemLayout = (_: any, index: number) => ({
  //   length: 277, // Estimated item height
  //   offset:
  //     index % 2 == 0
  //       ? 297 * Math.floor((index + 1) / 2)
  //       : 297 * Math.floor(index / 2),
  // });

  return (
    <FlashList
      disableAutoLayout
      extraData={cartData}
      ref={flatListRef}
      showsVerticalScrollIndicator={false}
      numColumns={2}
      data={data || []}
      keyExtractor={(item) => item._id}
      renderItem={renderProductItem}
      ListEmptyComponent={renderEmptyComponent}
      contentContainerStyle={styles.flatList}
      estimatedItemSize={277}
    />
  );
};

export default memo(ProductList);

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
