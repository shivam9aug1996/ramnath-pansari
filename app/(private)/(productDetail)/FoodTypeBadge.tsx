import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

type FoodTypeBadgeProps = {
  foodType?: string | null;
  size?: "sm" | "md";
  showLabel?: boolean;
};

function normalizeFoodType(
  value?: string | null
): "veg" | "non-veg" | null {
  if (!value) return null;
  const lower = value.toLowerCase().trim();
  if (lower === "non-veg" || lower === "non veg" || lower.includes("non")) {
    return "non-veg";
  }
  if (lower === "veg" || lower.includes("veg")) {
    return "veg";
  }
  return null;
}

const FoodTypeBadge = ({
  foodType,
  size = "md",
  showLabel = false,
}: FoodTypeBadgeProps) => {
  const type = normalizeFoodType(foodType);
  if (!type) return null;

  const isVeg = type === "veg";
  const boxSize = size === "sm" ? 16 : 20;
  const dotSize = size === "sm" ? 7 : 9;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.box,
          {
            width: boxSize,
            height: boxSize,
            borderColor: isVeg ? "#008000" : "#8B4513",
          },
        ]}
      >
        {isVeg ? (
          <View
            style={[
              styles.vegDot,
              { width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
            ]}
          />
        ) : (
          <View style={styles.nonVegTriangle} />
        )}
      </View>
      {showLabel ? (
        <Text
          style={[
            styles.label,
            { color: isVeg ? "#008000" : "#8B4513" },
          ]}
        >
          {isVeg ? "Veg" : "Non-Veg"}
        </Text>
      ) : null}
    </View>
  );
};

export default memo(FoodTypeBadge);

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  box: {
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  vegDot: {
    backgroundColor: "#008000",
  },
  nonVegTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 9,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#C62828",
    marginTop: 1,
  },
  label: {
    fontSize: 13,
    fontFamily: "Montserrat_600SemiBold",
  },
});
