import React, { memo, useEffect, useMemo, useState } from "react";
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
import ProductBrandPickerSheet from "./ProductBrandPickerSheet";
import ProductSheetShell from "./ProductSheetShell";

const PREVIEW_CHIP_COUNT = 3;

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
  const [brandPickerOpen, setBrandPickerOpen] = useState(false);

  useEffect(() => {
    if (!visible) setBrandPickerOpen(false);
  }, [visible]);

  const selectedBrands = useMemo(() => {
    return [...draft.brands].sort((a, b) => a.localeCompare(b));
  }, [draft.brands]);

  const previewBrands = selectedBrands.slice(0, PREVIEW_CHIP_COUNT);
  const extraCount = Math.max(
    0,
    selectedBrands.length - PREVIEW_CHIP_COUNT,
  );

  const removeBrand = (brand: string) => {
    const lower = brand.toLowerCase();
    onChange({
      ...draft,
      brands: draft.brands.filter((b) => b.toLowerCase() !== lower),
    });
  };

  const setSort = (sort: ProductSortOption) => {
    onChange({ ...draft, sort });
  };

  const handleClose = () => {
    setBrandPickerOpen(false);
    onClose();
  };

  return (
    <>
      <ProductSheetShell
        visible={visible}
        onClose={handleClose}
        footer={
          <View style={styles.actions}>
            <Button
              title="Apply"
              onPress={onApply}
              isLoading={isApplying}
              wrapperStyle={styles.applyButton}
              textStyle={styles.applyText}
            />
            <Pressable style={styles.clearButton} onPress={onClear}>
              <Text style={styles.clearText}>Clear all</Text>
            </Pressable>
          </View>
        }
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {includeSort ? "Sort & Filters" : "Filters"}
            </Text>
            <Pressable
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={8}
            >
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
            style={[
              styles.sectionLabel,
              includeSort ? { marginTop: 18 } : null,
            ]}
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
            <>
              <Pressable
                style={styles.brandEntry}
                onPress={() => setBrandPickerOpen(true)}
              >
                <View style={styles.brandEntryTextWrap}>
                  <Text style={styles.brandEntryTitle}>
                    {selectedBrands.length > 0
                      ? `${selectedBrands.length} selected`
                      : "Choose brands"}
                  </Text>
                  <Text style={styles.brandEntryHint}>
                    Browse A–Z or search
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={Colors.light.mediumGrey}
                />
              </Pressable>

              {previewBrands.length > 0 ? (
                <View style={styles.brandWrap}>
                  {previewBrands.map((brand) => (
                    <Pressable
                      key={brand}
                      style={[styles.brandChip, styles.brandChipOn]}
                      onPress={() => removeBrand(brand)}
                      hitSlop={4}
                    >
                      <Text style={[styles.brandChipText, styles.brandChipTextOn]}>
                        {brand}
                      </Text>
                      <Ionicons
                        name="close"
                        size={12}
                        color={Colors.light.darkGreen}
                      />
                    </Pressable>
                  ))}
                  {extraCount > 0 ? (
                    <Pressable
                      style={styles.brandChip}
                      onPress={() => setBrandPickerOpen(true)}
                    >
                      <Text style={styles.brandChipText}>+{extraCount}</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </>
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
        </View>
      </ProductSheetShell>

      <ProductBrandPickerSheet
        visible={brandPickerOpen}
        brands={brands}
        selected={draft.brands}
        onChange={(nextBrands) => onChange({ ...draft, brands: nextBrands })}
        onClose={() => setBrandPickerOpen(false)}
      />
    </>
  );
};

export default memo(ProductFilterSheet);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
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
  brandEntry: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#F8FAF9",
    borderWidth: 1,
    borderColor: "#E6EBE8",
  },
  brandEntryTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  brandEntryTitle: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 14,
    color: Colors.light.darkGrey,
  },
  brandEntryHint: {
    marginTop: 2,
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
    color: Colors.light.mediumGrey,
  },
  brandWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  brandChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 4,
  },
  applyButton: {
    marginTop: 0,
  },
  applyText: {
    fontSize: 14,
    fontFamily: "Montserrat_600SemiBold",
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
