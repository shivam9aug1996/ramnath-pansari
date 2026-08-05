import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";
import { useGoToCartInset } from "@/contexts/DeliveryFloatContext";
import {
  ProductFilterValues,
  PRODUCT_SORT_OPTIONS,
  countActiveProductFilters,
} from "@/utils/productFilters";

type ProductFilterFabProps = {
  filters: ProductFilterValues;
  onPress: () => void;
  onClear?: () => void;
};

const ProductFilterFab = ({
  filters,
  onPress,
  onClear,
}: ProductFilterFabProps) => {
  const insets = useSafeAreaInsets();
  const goToCartInset = useGoToCartInset();
  const activeCount = countActiveProductFilters(filters);
  const sortLabel =
    PRODUCT_SORT_OPTIONS.find((o) => o.value === filters.sort)?.label ??
    "Relevance";
  const shortSort =
    filters.sort === "relevance"
      ? "Sort & Filters"
      : filters.sort === "price_asc"
        ? "Price ↑"
        : filters.sort === "price_desc"
          ? "Price ↓"
          : "Name A–Z";

  const bottom = Math.max(goToCartInset, insets.bottom + 12) + 12;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${shortSort}${activeCount ? `, ${activeCount} active` : ""}`}
        onPress={onPress}
        style={[styles.fab, activeCount > 0 && styles.fabActive]}
      >
        <Ionicons
          name="options-outline"
          size={18}
          color={activeCount > 0 ? Colors.light.white : Colors.light.darkGreen}
        />
        <Text
          style={[styles.fabText, activeCount > 0 && styles.fabTextActive]}
          numberOfLines={1}
        >
          {shortSort}
        </Text>
        {activeCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeCount}</Text>
          </View>
        ) : null}
      </Pressable>

      {activeCount > 0 && onClear ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear filters"
          onPress={onClear}
          style={styles.clearBtn}
          hitSlop={8}
        >
          <Ionicons name="close" size={16} color={Colors.light.darkGrey} />
        </Pressable>
      ) : null}
    </View>
  );
};

export default memo(ProductFilterFab);

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 16,
    left: 16,
    zIndex: 40,
    elevation: 40,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "78%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E0DC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  fabActive: {
    backgroundColor: Colors.light.mediumGreen,
    borderColor: Colors.light.mediumGreen,
  },
  fabText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 13,
    color: Colors.light.darkGrey,
  },
  fabTextActive: {
    color: Colors.light.white,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.white,
  },
  badgeText: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 11,
    color: Colors.light.darkGreen,
  },
  clearBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EBE8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
});
