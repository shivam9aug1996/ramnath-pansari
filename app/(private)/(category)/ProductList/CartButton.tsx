import React, { memo, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Pressable, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { CartButtonProps } from "@/types/global";
import { useCartOperations } from "../../hooks/useCartOperations";


const CartButton = ({ value, item }: CartButtonProps) => {
  const { quantity, handleAdd, handleRemove } = useCartOperations(item, value);

  const animatedWidth = useSharedValue(quantity > 0 ? 100 : 75);

  useEffect(() => {
    animatedWidth.value = withTiming(quantity > 0 ? 100 : 75, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [quantity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: animatedWidth.value,
    };
  });

  if (item?.isOutOfStock) {
    return (
      <View style={styles.container}>
        <View style={styles.outOfStockButton}>
          <Text style={styles.outOfStockText} numberOfLines={1}>
            Sold out
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      <Animated.View style={[styles.animatedWrapper, animatedStyle]}>
     

        {quantity > 0 ? (
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
    bottom: 8,
    right: 8,
    zIndex: 10,
  },
  animatedWrapper: {
    height: 36,
    overflow: "hidden",
  },
  addButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1.5,
    borderColor: "#0d9448",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    borderRadius: 8,
  },
  addButtonText: {
    color: "#0d9448",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(38, 173, 113, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 4,
    height: "100%",
    borderRadius: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 18,
  },
  quantityDisplay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  quantityText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  outOfStockButton: {
    width: 75,
    height: 36,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  outOfStockText: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});

export default memo(CartButton);
