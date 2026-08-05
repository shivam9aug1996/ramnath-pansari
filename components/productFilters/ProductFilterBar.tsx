import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import {
  ProductFilterValues,
  PRODUCT_SORT_OPTIONS,
  countActiveProductFilters,
} from "@/utils/productFilters";

type ProductFilterBarProps = {
  filters: ProductFilterValues;
  onOpenSort: () => void;
  onOpenFilters: () => void;
  onClearFilters: () => void;
};

const ProductFilterBar = ({
  filters,
  onOpenSort,
  onOpenFilters,
  onClearFilters,
}: ProductFilterBarProps) => {
  const activeCount = countActiveProductFilters(filters);
  const sortLabel =
    PRODUCT_SORT_OPTIONS.find((o) => o.value === filters.sort)?.label ??
    "Relevance";
  const filterOnlyCount =
    activeCount - (filters.sort !== "relevance" ? 1 : 0);

  return (
    <View style={styles.container}>
      <Pressable style={styles.chip} onPress={onOpenSort} hitSlop={4}>
        <Ionicons
          name="swap-vertical-outline"
          size={16}
          color={Colors.light.darkGreen}
        />
        <Text style={styles.chipText} numberOfLines={1}>
          {sortLabel}
        </Text>
      </Pressable>

      <Pressable style={styles.chip} onPress={onOpenFilters} hitSlop={4}>
        <Ionicons
          name="options-outline"
          size={16}
          color={Colors.light.darkGreen}
        />
        <Text style={styles.chipText}>
          Filters{filterOnlyCount > 0 ? ` (${filterOnlyCount})` : ""}
        </Text>
      </Pressable>

      {activeCount > 0 ? (
        <Pressable style={styles.clearChip} onPress={onClearFilters} hitSlop={8}>
          <Text style={styles.clearChipText}>Clear</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

export default memo(ProductFilterBar);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "#F3F5F4",
    borderWidth: 1,
    borderColor: "#D8E0DC",
    maxWidth: "48%",
  },
  chipText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 13,
    color: Colors.light.darkGrey,
  },
  clearChip: {
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clearChipText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 13,
    color: Colors.light.mediumGrey,
  },
});
