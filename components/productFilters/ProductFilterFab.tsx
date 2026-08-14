import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import {
  ProductFilterValues,
  PRODUCT_SORT_OPTIONS,
  countActiveProductFilters,
} from "@/utils/productFilters";

type ProductFilterFabProps = {
  filters: ProductFilterValues;
  onPress: () => void;
  onClear?: () => void;
  /** Override bar padding — category chrome uses 30 to match chip rows. */
  barStyle?: object;
  /** Total matching products from API. */
  resultCount?: number;
  /** Products loaded in the list so far (infinite scroll). */
  loadedCount?: number;
};

function formatResultProgress(
  resultCount?: number,
  loadedCount?: number,
): string | null {
  if (resultCount == null || resultCount < 0) return null;
  if (resultCount === 0) return "0 results";

  // Hide 0 / N while first page hasn't landed.
  if (loadedCount == null || loadedCount <= 0) {
    return `${resultCount} results`;
  }

  const loaded = Math.min(loadedCount, resultCount);

  // All loaded (first page only, or last page).
  if (loaded >= resultCount) {
    return `${resultCount} results`;
  }

  return `${loaded} / ${resultCount}`;
}

/** Compact Sort & Filters chip — sits below subcategory chips. */
const ProductFilterFab = ({
  filters,
  onPress,
  onClear,
  barStyle,
  resultCount,
  loadedCount,
}: ProductFilterFabProps) => {
  const activeCount = countActiveProductFilters(filters);
  const sortLabel =
    PRODUCT_SORT_OPTIONS.find((o) => o.value === filters.sort)?.label ??
    "Relevance";
  const label =
    filters.sort === "relevance"
      ? activeCount > 0
        ? `Filters (${activeCount})`
        : "Sort & Filters"
      : activeCount > 1
        ? `${sortLabel} · +${activeCount - 1}`
        : sortLabel;

  const progressLabel = formatResultProgress(resultCount, loadedCount);

  return (
    <View style={[styles.bar, barStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}${activeCount ? `, ${activeCount} active` : ""}`}
        onPress={onPress}
        style={[styles.chip, activeCount > 0 && styles.chipActive]}
        hitSlop={4}
      >
        <Ionicons
          name="options-outline"
          size={14}
          color={
            activeCount > 0 ? Colors.light.white : Colors.light.darkGreen
          }
        />
        <Text
          style={[styles.chipText, activeCount > 0 && styles.chipTextActive]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>

      {activeCount > 0 && onClear ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear filters"
          onPress={onClear}
          style={styles.clearChip}
          hitSlop={8}
        >
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }} />

      {progressLabel ? (
        <Text style={styles.resultCount} numberOfLines={1}>
          {progressLabel}
        </Text>
      ) : null}
    </View>
  );
};

export default memo(ProductFilterFab);

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 30,
    paddingTop: 2,
    paddingBottom: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#F3F5F4",
    borderWidth: 1,
    borderColor: "#D8E0DC",
    maxWidth: "70%",
  },
  chipActive: {
    backgroundColor: Colors.light.mediumGreen,
    borderColor: Colors.light.mediumGreen,
  },
  chipText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 11,
    color: Colors.light.darkGrey,
  },
  chipTextActive: {
    color: Colors.light.white,
  },
  clearChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 11,
    color: Colors.light.mediumGrey,
  },
  resultCount: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
    color: Colors.light.darkGreen,
    flexShrink: 1,
  },
});
