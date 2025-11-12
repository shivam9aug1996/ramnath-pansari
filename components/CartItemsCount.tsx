import { Animated, StyleSheet, Text, View } from "react-native";
import React from "react";
import { ThemedText } from "./ThemedText";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";

const CartItemsCount = ({
  animatedHeaderStyle,
}: {
  animatedHeaderStyle: any;
}) => {
    const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const {
    data: cartData,
    isFetching: isCartFetching,
    isError: isCartError,
    isLoading: isCartLoading,
  } = useFetchCartQuery(
    {
      userId,
    },
    {
      skip: !userId,
    }
  );
  const cartItems = cartData?.cart?.items?.length || 0;
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          right: 0,
          alignItems: "center",
          padding: 10,
        },
        animatedHeaderStyle,
      ]}
    >
      <ThemedText type="screenHeader">{`${cartItems} items`}</ThemedText>
    </Animated.View>
  );
};

export default CartItemsCount;

const styles = StyleSheet.create({});
