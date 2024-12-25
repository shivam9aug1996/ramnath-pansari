import { FlatList, StyleSheet, Text, View } from "react-native";
import React, { memo, useCallback } from "react";
import CartPlaceholder from "./CartPlaceholder";
import CartItem from "./CartItem";
import { CartItemProps } from "@/types/global";

const CartList = ({ cartItemIndex, isCartProcessing, cartData }) => {
  console.log("loptr57");
  const renderItem = useCallback(({ item, index }: CartItemProps) => {
    return <CartItem key={item?.productDetails?._id || index} item={item} />;
  }, []);
  return (
    <FlatList
      initialNumToRender={3}
      //disableAutoLayout
      ListHeaderComponent={
        cartItemIndex == -1 && isCartProcessing ? (
          <CartPlaceholder
            wrapperStyle={{ paddingHorizontal: 0, paddingTop: 0 }}
            count={1}
          />
        ) : null
      }
      extraData={cartData?.cart?.items}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
      data={cartData?.cart?.items}
      renderItem={renderItem}
      keyExtractor={(item, index) => item?.productDetails?._id || index}

      // estimatedItemSize={101}
    />
  );
};

export default memo(CartList);

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 20,
    paddingTop: 5,
  },
});
