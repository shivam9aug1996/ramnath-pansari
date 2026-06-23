import {
  Easing,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { memo, useCallback, useMemo, useRef, useEffect } from "react";
import CartPlaceholder from "./CartPlaceholder";
import CartItem from "./CartItem";
import { CartItemProps, RootState } from "@/types/global";
import { throttle } from "lodash";
import { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useFocusEffect } from "expo-router";
import { useSelector } from "react-redux";
import { useCartFooterInset } from "@/contexts/DeliveryFloatContext";

const ITEM_HEIGHT = 117;
const CART_LIST_EXTRA_PADDING = 24;

const CartList = ({ cartItemIndex, isCartProcessing, cartData }) => {
  const flatListRef = useRef(null);
  const cartFooterInset = useCartFooterInset();

  const listContentStyle = useMemo(
    () => [
      styles.listContainer,
      {
        paddingBottom:
          Math.max(cartFooterInset, 200) + CART_LIST_EXTRA_PADDING,
      },
    ],
    [cartFooterInset],
  );


  const renderItem = useCallback(({ item, index }: CartItemProps) => {
    return <CartItem key={item?.productDetails?._id || index} item={item} />;
  }, []);

  return (
    <FlatList
      // getItemLayout={(data, index) => ({
      //   length: ITEM_HEIGHT,
      //   offset: ITEM_HEIGHT * index,
      //   index,
      // })}
      contentContainerStyle={listContentStyle}
      bounces={Platform.OS === "android" ? false : true}
      ref={flatListRef}
      initialNumToRender={4}
      // ListHeaderComponent={
      //   cartItemIndex == -1 && isCartProcessing ? (
      //     <CartPlaceholder
      //       wrapperStyle={{ paddingHorizontal: 0, paddingTop: 0 }}
      //       count={1}
      //     />
      //   ) : null
      // }
      showsVerticalScrollIndicator={false}
      
      data={cartData?.cart?.items}
      renderItem={renderItem}
      keyExtractor={(item, index) => item?.productDetails?._id || index}
    />
  );
};

export default memo(CartList);

const styles = StyleSheet.create({
  listContainer: {
    paddingTop: 30,
    paddingBottom: 280,
  },
});
