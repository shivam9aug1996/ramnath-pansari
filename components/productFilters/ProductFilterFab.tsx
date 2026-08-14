import React, { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
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
  barStyle?: ViewStyle;
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

  if (loadedCount == null || loadedCount <= 0) {
    return `${resultCount} results`;
  }

  const loaded = Math.min(loadedCount, resultCount);

  if (loaded >= resultCount) {
    return `${resultCount} results`;
  }

  return `${loaded} / ${resultCount}`;
}

const ProductFilterFab = ({
  filters,
  onPress,
  onClear,
  barStyle,
  resultCount,
  loadedCount,
}: ProductFilterFabProps) => {
  const activeCount = useMemo(
    () => countActiveProductFilters(filters),
    [filters],
  );

  const label = useMemo(() => {
    const sortLabel =
      PRODUCT_SORT_OPTIONS.find((o) => o.value === filters.sort)?.label ??
      "Relevance";

    if (filters.sort === "relevance") {
      return activeCount > 0
        ? `Filters (${activeCount})`
        : "Sort & Filters";
    }

    return activeCount > 1
      ? `${sortLabel} · +${activeCount - 1}`
      : sortLabel;
  }, [filters.sort, activeCount]);

  const progressLabel = useMemo(
    () => formatResultProgress(resultCount, loadedCount),
    [resultCount, loadedCount],
  );

  const hasActiveFilters = activeCount > 0;

  return (
    <View style={[styles.bar, barStyle]}>
      <View style={styles.leftControls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}${hasActiveFilters ? `, ${activeCount} active` : ""}`}
          onPress={onPress}
          style={[styles.chip, hasActiveFilters && styles.chipActive]}
          hitSlop={6}
        >
          <Ionicons
            name="options-outline"
            size={14}
            color={
              hasActiveFilters ? Colors.light.white : Colors.light.darkGreen
            }
          />
          <Text
            style={[styles.chipText, hasActiveFilters && styles.chipTextActive]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </Pressable>

        {hasActiveFilters && Boolean(onClear) && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear filters"
            onPress={onClear}
            style={styles.clearChip}
            hitSlop={8}
          >
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>

      {Boolean(progressLabel) && (
        <Text style={styles.resultCount} numberOfLines={1}>
          {progressLabel}
        </Text>
      )}
    </View>
  );
};

export default memo(ProductFilterFab);

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 30,
    paddingTop: 2,
    paddingBottom: 6,
  },
  leftControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
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
    flexShrink: 0,
  },
  chipActive: {
    backgroundColor: Colors.light.mediumGreen,
    borderColor: Colors.light.mediumGreen,
  },
  chipText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 11,
    color: Colors.light.darkGrey,
    flexShrink: 0,
  },
  chipTextActive: {
    color: Colors.light.white,
  },
  clearChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
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
    flexShrink: 0,
  },
});