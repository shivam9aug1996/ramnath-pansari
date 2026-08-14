import { StyleSheet, Text, TouchableOpacity } from "react-native";
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

const CartIcon = ({ inline = false }: { inline?: boolean }) => {
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
      style={inline ? styles.inlineHit : styles.absoluteHit}
    >
      <Ionicons name="bag-handle" size={24} color={Colors.light.mediumGrey} />

      {cartItems > 0 && (
        <Animated.View
          style={[
            styles.badge,
            inline ? styles.badgeInline : null,
            animatedStyle,
          ]}
        >
          <Text
            style={styles.badgeText}
          >
            {cartItems > 9 ? "9+" : cartItems}
          </Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

export default CartIcon;

const styles = StyleSheet.create({
  absoluteHit: {
    position: "absolute",
    right: 0,
    alignItems: "center",
    padding: 10,
  },
  inlineHit: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  badge: {
    minWidth: 12,
    height: 12,
    backgroundColor: "#EC534A",
    borderRadius: 6,
    position: "absolute",
    top: 10,
    right: 5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  badgeInline: {
    top: 6,
    right: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 8,
    fontWeight: "700",
    lineHeight: 10,
  },
});
