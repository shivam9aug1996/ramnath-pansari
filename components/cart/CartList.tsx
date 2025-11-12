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

const ITEM_HEIGHT = 117;

const CartList = ({ cartItemIndex, isCartProcessing, cartData }) => {
  const flatListRef = useRef(null);


  const renderItem = useCallback(({ item, index }: CartItemProps) => {
    return <CartItem key={item?.productDetails?._id || index} item={item} />;
  }, []);
  console.log("cartItemI4567890ndex",cartData)

  return (
    <FlatList
      // getItemLayout={(data, index) => ({
      //   length: ITEM_HEIGHT,
      //   offset: ITEM_HEIGHT * index,
      //   index,
      // })}
      contentContainerStyle={styles.listContainer}
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
