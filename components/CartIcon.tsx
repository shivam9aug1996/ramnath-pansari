import { Platform, StyleSheet, Text, TouchableOpacity } from "react-native";
import React, { useEffect, useMemo, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Colors } from "@/constants/Colors";

const CartIcon = () => {
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const { data: cartData } = useFetchCartQuery(
    {
      userId,
    },
    {
      skip: !userId,
    },
  );

  const cartItems = cartData?.cart?.items?.length || 0;
  const totalQuantity = useMemo(() => {
    return (
      cartData?.cart?.items?.reduce(
        (total: number, item: any) => total + (item.quantity || 0),
        0,
      ) || 0
    );
  }, [cartData?.cart?.items]);

  const prevCount = useRef(totalQuantity);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (totalQuantity > prevCount.current) {
      scale.value = 1.5;
      scale.value = withSpring(1, { damping: 1 });
    } else if (totalQuantity < prevCount.current) {
      scale.value = 0.7;
      scale.value = withSpring(1, { damping: 1 });
    }

    prevCount.current = totalQuantity;
  }, [totalQuantity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={() => {
        router.navigate("/(cartScreen)/cartScreen");
      }}
      style={{
        position: "absolute",
        right: 0,
        alignItems: "center",
        padding: 10,
      }}
    >
      <Ionicons name="bag-handle" size={24}
        color={Colors.light.mediumGrey} />

      {cartItems > 0 && (
        <Animated.View
          style={[
            {
              minWidth: 14,
              height: 14,
              backgroundColor: "#EC534A",
              borderRadius: 7,
              position: "absolute",
              top: 10,
              right: 5,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 2,
            },
            animatedStyle,
          ]}
        >
          <Text
            style={{
              color: "white",
              fontSize: Platform.OS === "android" ? 8 : 10,
            }}
          >
            {cartItems}
          </Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

export default CartIcon;

const styles = StyleSheet.create({});
