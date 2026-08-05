import React, { memo, useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import Button from "@/components/Button";
import {
  ProductFilterValues,
  PRODUCT_SORT_OPTIONS,
  ProductSortOption,
} from "@/utils/productFilters";
import ProductSheetShell from "./ProductSheetShell";

type ProductFilterSheetProps = {
  visible: boolean;
  draft: ProductFilterValues;
  onChange: (next: ProductFilterValues) => void;
  brands: string[];
  brandsLoading?: boolean;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
  isApplying?: boolean;
  includeSort?: boolean;
};

const ProductFilterSheet = ({
  visible,
  draft,
  onChange,
  brands,
  brandsLoading = false,
  onApply,
  onClear,
  onClose,
  isApplying = false,
  includeSort = true,
}: ProductFilterSheetProps) => {
  const selectedSet = useMemo(
    () => new Set(draft.brands.map((b) => b.toLowerCase())),
    [draft.brands],
  );

  const toggleBrand = (brand: string) => {
    const lower = brand.toLowerCase();
    const exists = draft.brands.some((b) => b.toLowerCase() === lower);
    onChange({
      ...draft,
      brands: exists
        ? draft.brands.filter((b) => b.toLowerCase() !== lower)
        : [...draft.brands, brand],
    });
  };

  const setSort = (sort: ProductSortOption) => {
    onChange({ ...draft, sort });
  };

  return (
    <ProductSheetShell visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {includeSort ? "Sort & Filters" : "Filters"}
          </Text>
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={20} color={Colors.light.darkGrey} />
          </Pressable>
        </View>

        {includeSort ? (
          <>
            <Text style={styles.sectionLabel}>Sort by</Text>
            <View style={styles.sortWrap}>
              {PRODUCT_SORT_OPTIONS.map((option) => {
                const selected = draft.sort === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.sortChip, selected && styles.sortChipOn]}
                    onPress={() => setSort(option.value)}
                  >
                    <Text
                      style={[
                        styles.sortChipText,
                        selected && styles.sortChipTextOn,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        <Text
          style={[styles.sectionLabel, includeSort ? { marginTop: 18 } : null]}
        >
          Brand
        </Text>
        {brandsLoading ? (
          <ActivityIndicator
            color={Colors.light.lightGreen}
            style={{ marginVertical: 12 }}
          />
        ) : brands.length === 0 ? (
          <Text style={styles.emptyHint}>No brands available</Text>
        ) : (
          <View style={styles.brandWrap}>
            {brands.map((brand) => {
              const selected = selectedSet.has(brand.toLowerCase());
              return (
                <Pressable
                  key={brand}
                  style={[styles.brandChip, selected && styles.brandChipOn]}
                  onPress={() => toggleBrand(brand)}
                >
                  <Text
                    style={[
                      styles.brandChipText,
                      selected && styles.brandChipTextOn,
                    ]}
                  >
                    {brand}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>
          Availability
        </Text>
        <Pressable
          style={styles.toggleRow}
          onPress={() =>
            onChange({ ...draft, inStockOnly: !draft.inStockOnly })
          }
        >
          <Text style={styles.toggleLabel}>In stock only</Text>
          <View
            style={[styles.checkbox, draft.inStockOnly && styles.checkboxOn]}
          >
            {draft.inStockOnly ? (
              <Ionicons name="checkmark" size={14} color="#fff" />
            ) : null}
          </View>
        </Pressable>

        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>
          Price range (₹)
        </Text>
        <View style={styles.priceRow}>
          <View style={styles.priceInputWrap}>
            <TextInput
              value={draft.priceMin}
              onChangeText={(priceMin) =>
                onChange({
                  ...draft,
                  priceMin: priceMin.replace(/[^0-9.]/g, ""),
                })
              }
              placeholder="Min"
              placeholderTextColor={Colors.light.mediumGrey}
              keyboardType="decimal-pad"
              style={styles.priceInput}
            />
          </View>
          <Text style={styles.priceDash}>–</Text>
          <View style={styles.priceInputWrap}>
            <TextInput
              value={draft.priceMax}
              onChangeText={(priceMax) =>
                onChange({
                  ...draft,
                  priceMax: priceMax.replace(/[^0-9.]/g, ""),
                })
              }
              placeholder="Max"
              placeholderTextColor={Colors.light.mediumGrey}
              keyboardType="decimal-pad"
              style={styles.priceInput}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Apply"
            onPress={onApply}
            isLoading={isApplying}
            wrapperStyle={styles.applyButton}
          />
          <Pressable style={styles.clearButton} onPress={onClear}>
            <Text style={styles.clearText}>Clear all</Text>
          </Pressable>
        </View>
      </View>
    </ProductSheetShell>
  );
};

export default memo(ProductFilterSheet);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 22,
    color: Colors.light.darkGrey,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F5F4",
  },
  sectionLabel: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 13,
    color: Colors.light.darkGrey,
    marginBottom: 10,
  },
  sortWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6EBE8",
    backgroundColor: "#F8FAF9",
  },
  sortChipOn: {
    borderColor: Colors.light.lightGreen,
    backgroundColor: "#E8F6EE",
  },
  sortChipText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 13,
    color: Colors.light.darkGrey,
  },
  sortChipTextOn: {
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.darkGreen,
  },
  emptyHint: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 13,
    color: Colors.light.mediumGrey,
    marginBottom: 8,
  },
  brandWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  brandChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6EBE8",
    backgroundColor: "#F8FAF9",
  },
  brandChipOn: {
    borderColor: Colors.light.lightGreen,
    backgroundColor: "#E8F6EE",
  },
  brandChipText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 13,
    color: Colors.light.darkGrey,
  },
  brandChipTextOn: {
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.darkGreen,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#F8FAF9",
    borderWidth: 1,
    borderColor: "#E6EBE8",
  },
  toggleLabel: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    color: Colors.light.darkGrey,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#C9D4CE",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxOn: {
    backgroundColor: Colors.light.lightGreen,
    borderColor: Colors.light.lightGreen,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  priceInputWrap: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E6EBE8",
    borderRadius: 14,
    backgroundColor: "#F8FAF9",
    paddingHorizontal: 12,
  },
  priceInput: {
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontFamily: "Montserrat_500Medium",
    fontSize: 15,
    color: Colors.light.darkGrey,
  },
  priceDash: {
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.mediumGrey,
  },
  actions: {
    marginTop: 20,
    gap: 4,
  },
  applyButton: {
    marginTop: 0,
  },
  clearButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  clearText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 14,
    color: Colors.light.mediumGrey,
  },
});
