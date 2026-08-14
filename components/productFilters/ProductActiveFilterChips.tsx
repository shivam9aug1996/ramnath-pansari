import React, { memo, useCallback, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { Colors } from "@/constants/Colors";
import {
  ProductFilterValues,
  PRODUCT_SORT_OPTIONS,
} from "@/utils/productFilters";

type ProductActiveFilterChipsProps = {
  filters: ProductFilterValues;
  onChange: (next: ProductFilterValues) => void;
};

type ChipItem = {
  key: string;
  label: string;
  type: "sort" | "brand" | "stock" | "price";
  value?: string;
};

const ProductActiveFilterChips = ({
  filters,
  onChange,
}: ProductActiveFilterChipsProps) => {
  const chips = useMemo(() => {
    const items: ChipItem[] = [];

    if (filters.sort !== "relevance") {
      const label =
        PRODUCT_SORT_OPTIONS.find((o) => o.value === filters.sort)?.label ??
        filters.sort;
      items.push({
        key: "sort",
        label,
        type: "sort",
      });
    }

    for (const brand of filters.brands) {
      items.push({
        key: `brand-${brand}`,
        label: brand,
        type: "brand",
        value: brand,
      });
    }

    if (filters.inStockOnly) {
      items.push({
        key: "stock",
        label: "In stock",
        type: "stock",
      });
    }

    const min = filters.priceMin.trim();
    const max = filters.priceMax.trim();
    if (min || max) {
      items.push({
        key: "price",
        label: `₹${min || "0"}–${max || "∞"}`,
        type: "price",
      });
    }

    return items;
  }, [
    filters.sort,
    filters.brands,
    filters.inStockOnly,
    filters.priceMin,
    filters.priceMax,
  ]);

  const handleRemoveChip = useCallback(
    (chip: ChipItem) => {
      switch (chip.type) {
        case "sort":
          onChange({ ...filters, sort: "relevance" });
          break;
        case "brand":
          onChange({
            ...filters,
            brands: filters.brands.filter((b) => b !== chip.value),
          });
          break;
        case "stock":
          onChange({ ...filters, inStockOnly: false });
          break;
        case "price":
          onChange({ ...filters, priceMin: "", priceMax: "" });
          break;
      }
    },
    [filters, onChange],
  );

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
          onPress={() => handleRemoveChip(chip)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Remove filter ${chip.label}`}
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