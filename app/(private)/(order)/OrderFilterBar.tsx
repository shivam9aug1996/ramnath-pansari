import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { OrderFilterValues } from "./OrderFilters";

type OrderFilterBarProps = {
  appliedFilters: OrderFilterValues;
  onOpenFilters: () => void;
  onClearFilters: () => void;
};

function countActiveFilters(filters: OrderFilterValues) {
  return filters.orderId.trim() ? 1 : 0;
}

const OrderFilterBar = ({
  appliedFilters,
  onOpenFilters,
  onClearFilters,
}: OrderFilterBarProps) => {
  const activeCount = countActiveFilters(appliedFilters);
  const hasActiveFilters = activeCount > 0;

  return (
    <View style={styles.container}>
      <Pressable style={styles.mainArea} onPressIn={onOpenFilters}>
        <View style={styles.iconWrap}>
          <Ionicons
            name="options-outline"
            size={18}
            color={Colors.light.lightGreen}
          />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Filters</Text>
          <Text style={styles.subtitle}>
            {hasActiveFilters
              ? `${activeCount} active · Tap to edit`
              : "Search by order ID"}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={Colors.light.mediumGrey}
        />
      </Pressable>

      {hasActiveFilters ? (
        <Pressable style={styles.clearChip} onPress={onClearFilters} hitSlop={8}>
          <Text style={styles.clearChipText}>Clear</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

export default memo(OrderFilterBar);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EBE8",
  },
  mainArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2FBF6",
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 15,
    color: Colors.light.darkGrey,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
    color: Colors.light.mediumGrey,
  },
  clearChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F5F4",
  },
  clearChipText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 12,
    color: Colors.light.mediumGrey,
  },
});
