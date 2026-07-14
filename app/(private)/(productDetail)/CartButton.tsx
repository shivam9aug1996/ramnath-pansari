import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { CartButtonProps } from "@/types/global";
import { useCartOperations } from "../hooks/useCartOperations";

const BUTTON_HEIGHT = 50;
const RADIUS = 12;

const CartButton = ({ value, item }: CartButtonProps) => {
  const { quantity, handleAdd, handleRemove } = useCartOperations(item, value);
  const inCart = quantity > 0;

  if (item?.isOutOfStock) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.soldOut}>
          <Text style={styles.soldOutText}>Out of stock</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.bar, inCart ? styles.barActive : styles.barIdle]}>
        {inCart ? (
          <>
            <View style={styles.statusBlock}>
              <Text style={styles.statusTitle}>Added to bag</Text>
              <Text style={styles.statusSub}>
                {quantity} item{quantity > 1 ? "s" : ""}
              </Text>
            </View>

            <View style={styles.stepperCapsule}>
              <Pressable
                onPress={handleRemove}
                style={({ pressed }) => [
                  styles.capsuleBtn,
                  pressed && styles.capsuleBtnPressed,
                ]}
                hitSlop={6}
              >
                <Text style={styles.capsuleSymbol}>−</Text>
              </Pressable>

              <Text style={styles.capsuleQty}>{quantity}</Text>

              <Pressable
                onPress={handleAdd}
                style={({ pressed }) => [
                  styles.capsuleBtn,
                  pressed && styles.capsuleBtnPressed,
                ]}
                hitSlop={6}
              >
                <Text style={styles.capsuleSymbol}>+</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [
              styles.addRow,
              pressed && styles.addRowPressed,
            ]}
          >
            <View style={styles.addIconCircle}>
              <Text style={styles.addIconText}>+</Text>
            </View>
            <Text style={styles.addLabel}>Add to cart</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: BUTTON_HEIGHT,
  },
  bar: {
    height: BUTTON_HEIGHT,
    borderRadius: RADIUS,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  barIdle: {
    backgroundColor: Colors.light.softGreen,
    borderWidth: 1,
    borderColor: "rgba(38, 173, 113, 0.25)",
  },
  barActive: {
    backgroundColor: Colors.light.white,
    borderWidth: 1,
    borderColor: Colors.light.lightGrey,
    paddingHorizontal: 12,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  addRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: BUTTON_HEIGHT,
  },
  addRowPressed: {
    backgroundColor: "rgba(38, 173, 113, 0.08)",
  },
  addIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.gradientGreen_1,
    alignItems: "center",
    justifyContent: "center",
  },
  addIconText: {
    color: Colors.light.white,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  addLabel: {
    color: Colors.light.darkGreen,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
  },
  statusBlock: {
    flex: 1,
    paddingRight: 8,
  },
  statusTitle: {
    color: Colors.light.darkGreen,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
  },
  statusSub: {
    marginTop: 2,
    color: Colors.light.mediumGrey,
    fontSize: 12,
    fontFamily: "Montserrat_600SemiBold",
  },
  stepperCapsule: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.gradientGreen_1,
    borderRadius: 999,
    paddingHorizontal: 4,
    height: 36,
    minWidth: 108,
  },
  capsuleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  capsuleBtnPressed: {
    backgroundColor: "rgba(0, 0, 0, 0.12)",
  },
  capsuleSymbol: {
    color: Colors.light.white,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 22,
  },
  capsuleQty: {
    minWidth: 24,
    textAlign: "center",
    color: Colors.light.white,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
  },
  soldOut: {
    height: BUTTON_HEIGHT,
    borderRadius: RADIUS,
    backgroundColor: Colors.light.softGrey_2,
    borderWidth: 1,
    borderColor: Colors.light.lightGrey,
    alignItems: "center",
    justifyContent: "center",
  },
  soldOutText: {
    color: Colors.light.mediumLightGrey,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Montserrat_600SemiBold",
  },
});

export default memo(CartButton);
