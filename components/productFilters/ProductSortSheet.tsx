import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import {
  ProductSortOption,
  PRODUCT_SORT_OPTIONS,
} from "@/utils/productFilters";
import ProductSheetShell from "./ProductSheetShell";

type ProductSortSheetProps = {
  visible: boolean;
  value: ProductSortOption;
  onSelect: (sort: ProductSortOption) => void;
  onClose: () => void;
};

const ProductSortSheet = ({
  visible,
  value,
  onSelect,
  onClose,
}: ProductSortSheetProps) => {
  return (
    <ProductSheetShell visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Sort by</Text>
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={20} color={Colors.light.darkGrey} />
          </Pressable>
        </View>

        {PRODUCT_SORT_OPTIONS.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              style={styles.row}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
            >
              <Text
                style={[styles.rowLabel, selected && styles.rowLabelSelected]}
              >
                {option.label}
              </Text>
              {selected ? (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={Colors.light.lightGreen}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </ProductSheetShell>
  );
};

export default memo(ProductSortSheet);

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
    marginBottom: 12,
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E6EBE8",
  },
  rowLabel: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 15,
    color: Colors.light.darkGrey,
  },
  rowLabelSelected: {
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.darkGreen,
  },
});
