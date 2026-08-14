import React, { memo, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import { CartButtonProps, RootState } from "@/types/global";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import { useCartOperations } from "../../hooks/useCartOperations";

/** Same footprint for ADD and qty so they don't jump. */
const CONTROL_WIDTH = 76;
const CONTROL_HEIGHT = 28;
const ADD_WIDTH = CONTROL_WIDTH;
const QUANTITY_WIDTH = CONTROL_WIDTH;

const CartButton = ({
  value,
  item,
  inline = false,
}: CartButtonProps & { inline?: boolean }) => {
  const userId = useSelector(
    (state: RootState) => state.auth.userData?._id,
  );
  const isGuestUser = useSelector(
    (state: RootState) => state.auth.userData?.isGuestUser,
  );

  const skipCartQuery = !userId || !!isGuestUser;
  const { isLoading, isUninitialized, isSuccess, isError } = useFetchCartQuery(
    { userId },
    { skip: skipCartQuery },
  );

  const showCartLoader =
    !skipCartQuery && !isSuccess && !isError && (isLoading || isUninitialized);

  const { quantity, handleAdd, handleRemove } = useCartOperations(item, value);

  const hasQuantity = quantity > 0;
  const animatedWidth = useSharedValue(hasQuantity ? QUANTITY_WIDTH : ADD_WIDTH);
  const lastAnimatedWidth = useRef(hasQuantity ? QUANTITY_WIDTH : ADD_WIDTH);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (showCartLoader) {
      hasHydratedRef.current = false;
      return;
    }

    const targetWidth = hasQuantity ? QUANTITY_WIDTH : ADD_WIDTH;

    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      animatedWidth.value = targetWidth;
      lastAnimatedWidth.current = targetWidth;
      return;
    }

    if (lastAnimatedWidth.current === targetWidth) return;

    lastAnimatedWidth.current = targetWidth;
    animatedWidth.value = withTiming(targetWidth, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [showCartLoader, hasQuantity, animatedWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: animatedWidth.value,
  }));

  if (item?.isOutOfStock) {
    return (
      <View style={inline ? styles.inlineContainer : styles.container}>
        <View style={styles.outOfStockButton}>
          <Text style={styles.outOfStockText} numberOfLines={1}>
            Sold out
          </Text>
        </View>
      </View>
    );
  }

  if (showCartLoader) {
    return (
      <View style={inline ? styles.inlineContainer : styles.container}>
        <View style={styles.loaderButton}>
          <ActivityIndicator size="small" color="#0d9448" />
        </View>
      </View>
    );
  }

  return (
    <View style={inline ? styles.inlineContainer : styles.container}>
      <Animated.View style={[styles.animatedWrapper, animatedStyle]}>
        {hasQuantity ? (
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              onPress={handleRemove}
              style={styles.quantityButton}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>−</Text>
            </TouchableOpacity>
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{quantity}</Text>
            </View>
            <TouchableOpacity
              onPress={handleAdd}
              style={styles.quantityButton}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleAdd}
            style={styles.addButton}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>ADD</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 6,
    right: 6,
    zIndex: 10,
  },
  inlineContainer: {
    zIndex: 10,
  },
  animatedWrapper: {
    height: CONTROL_HEIGHT,
    overflow: "hidden",
  },
  loaderButton: {
    width: CONTROL_WIDTH,
    height: CONTROL_HEIGHT,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#0d9448",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    borderRadius: 8,
  },
  addButtonText: {
    color: "#0d9448",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d9448",
    height: "100%",
    borderRadius: 8,
  },
  quantityButton: {
    width: 26,
    height: CONTROL_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 16,
  },
  quantityDisplay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  outOfStockButton: {
    width: CONTROL_WIDTH,
    height: CONTROL_HEIGHT,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  outOfStockText: {
    color: "#9ca3af",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});

export default memo(CartButton);
