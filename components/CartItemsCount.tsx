import Animated from "react-native-reanimated";
import React, { memo } from "react";
import { StyleSheet } from "react-native";
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
  const { data: cartData } = useFetchCartQuery(
    { userId },
    { skip: !userId },
  );
  const cartItems = cartData?.cart?.items?.length || 0;
  const label = cartItems === 1 ? "1 item" : `${cartItems} items`;

  return (
    <Animated.View style={[styles.wrap, animatedHeaderStyle]}>
      <ThemedText type="screenHeader" numberOfLines={1} style={styles.text}>
        {label}
      </ThemedText>
    </Animated.View>
  );
};

export default memo(CartItemsCount);

const styles = StyleSheet.create({
  wrap: {
    flexShrink: 0,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingVertical: 10,
    paddingLeft: 8,
  },
  text: {
    flexShrink: 0,
  },
});
