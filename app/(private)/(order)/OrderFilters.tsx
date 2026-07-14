import React, { memo } from "react";
import {
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

export type OrderFilterValues = {
  orderId: string;
};

type OrderFiltersProps = {
  filters: OrderFilterValues;
  onChange: (filters: OrderFilterValues) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
  isApplying?: boolean;
};

const OrderFilters = ({
  filters,
  onChange,
  onApply,
  onClear,
  onClose,
  isApplying = false,
}: OrderFiltersProps) => {
  const hasDraftFilters = Boolean(filters.orderId.trim());

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filter orders</Text>
        <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
          <Ionicons name="close" size={20} color={Colors.light.darkGrey} />
        </Pressable>
      </View>

      <Text style={styles.subtitle}>Search by order ID.</Text>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Order ID</Text>
        <View style={styles.inputWrap}>
          <Ionicons
            name="search-outline"
            size={18}
            color={Colors.light.mediumGrey}
            style={styles.inputIcon}
          />
          <TextInput
            value={filters.orderId}
            onChangeText={(orderId) => onChange({ ...filters, orderId })}
            placeholder="e.g. 7859-963256-6356"
            placeholderTextColor={Colors.light.mediumGrey}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.textInput}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Apply filters"
          onPress={onApply}
          isLoading={isApplying}
          wrapperStyle={styles.applyButton}
        />
        {hasDraftFilters ? (
          <Pressable style={styles.clearButton} onPress={onClear}>
            <Text style={styles.clearText}>Clear filter</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

export default memo(OrderFilters);

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
    marginBottom: 6,
  },
  title: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 22,
    color: Colors.light.darkGrey,
  },
  subtitle: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    color: Colors.light.mediumGrey,
    lineHeight: 20,
    marginBottom: 20,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F5F4",
  },
  fieldBlock: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 13,
    color: Colors.light.darkGrey,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6EBE8",
    borderRadius: 16,
    backgroundColor: "#F8FAF9",
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontFamily: "Montserrat_500Medium",
    fontSize: 15,
    color: Colors.light.darkGrey,
  },
  actions: {
    marginTop: 8,
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
