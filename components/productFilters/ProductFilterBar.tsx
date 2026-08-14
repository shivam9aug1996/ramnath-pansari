import React, { memo, useMemo } from "react";
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
  const activeCount = useMemo(
    () => countActiveProductFilters(filters),
    [filters],
  );

  const sortLabel = useMemo(() => {
    return (
      PRODUCT_SORT_OPTIONS.find((o) => o.value === filters.sort)?.label ??
      "Relevance"
    );
  }, [filters.sort]);

  const filterOnlyCount = useMemo(() => {
    return activeCount - (filters.sort !== "relevance" ? 1 : 0);
  }, [activeCount, filters.sort]);

  const filterButtonLabel = useMemo(() => {
    return filterOnlyCount > 0 ? `Filters (${filterOnlyCount})` : "Filters";
  }, [filterOnlyCount]);

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.chip}
        onPress={onOpenSort}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Sort by ${sortLabel}`}
      >
        <Ionicons
          name="swap-vertical-outline"
          size={16}
          color={Colors.light.darkGreen}
        />
        <Text style={styles.chipText} numberOfLines={1}>
          {sortLabel}
        </Text>
      </Pressable>

      <Pressable
        style={styles.chip}
        onPress={onOpenFilters}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={filterButtonLabel}
      >
        <Ionicons
          name="options-outline"
          size={16}
          color={Colors.light.darkGreen}
        />
        <Text style={styles.chipText} numberOfLines={1}>
          {filterButtonLabel}
        </Text>
      </Pressable>

      {activeCount > 0 && (
        <Pressable
          style={styles.clearChip}
          onPress={onClearFilters}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear all filters"
        >
          <Text style={styles.clearChipText}>Clear</Text>
        </Pressable>
      )}
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