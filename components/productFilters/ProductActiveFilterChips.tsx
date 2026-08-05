import React, { memo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/Colors";
import {
  ProductFilterValues,
  PRODUCT_SORT_OPTIONS,
} from "@/utils/productFilters";

type ProductActiveFilterChipsProps = {
  filters: ProductFilterValues;
  onChange: (next: ProductFilterValues) => void;
};

const ProductActiveFilterChips = ({
  filters,
  onChange,
}: ProductActiveFilterChipsProps) => {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.sort !== "relevance") {
    const label =
      PRODUCT_SORT_OPTIONS.find((o) => o.value === filters.sort)?.label ??
      filters.sort;
    chips.push({
      key: "sort",
      label,
      onRemove: () => onChange({ ...filters, sort: "relevance" }),
    });
  }

  for (const brand of filters.brands) {
    chips.push({
      key: `brand-${brand}`,
      label: brand,
      onRemove: () =>
        onChange({
          ...filters,
          brands: filters.brands.filter((b) => b !== brand),
        }),
    });
  }

  if (filters.inStockOnly) {
    chips.push({
      key: "stock",
      label: "In stock",
      onRemove: () => onChange({ ...filters, inStockOnly: false }),
    });
  }

  const min = filters.priceMin.trim();
  const max = filters.priceMax.trim();
  if (min || max) {
    chips.push({
      key: "price",
      label: `₹${min || "0"}–${max || "∞"}`,
      onRemove: () => onChange({ ...filters, priceMin: "", priceMax: "" }),
    });
  }

  if (!chips.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {chips.map((chip) => (
        <Pressable
          key={chip.key}
          style={styles.chip}
          onPress={chip.onRemove}
          hitSlop={4}
        >
          <Text style={styles.chipText}>{chip.label}</Text>
          <Text style={styles.remove}>×</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};

export default memo(ProductActiveFilterChips);

const styles = StyleSheet.create({
  scroll: {
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#E8F6EE",
  },
  chipText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
    color: Colors.light.darkGreen,
  },
  remove: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 14,
    color: Colors.light.darkGreen,
    lineHeight: 16,
  },
});
