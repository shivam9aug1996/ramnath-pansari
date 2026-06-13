import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/Colors";
import { formatNumber } from "@/utils/utils";
import {
  calculateTotalAmount,
  calculateTotalAmountMrp,
} from "@/components/cart/utils";
import { getDeliveryFee } from "@/utils/deliveryFee";
import { CartItem } from "@/types/global";

type OrderPaymentBreakdownProps = {
  cartItems: CartItem[];
  subtotal?: number;
  deliveryFee?: number;
};

function BreakdownRow({
  label,
  value,
  valueStyle,
  labelStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
  labelStyle?: object;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      <Text style={[styles.value, valueStyle]}>{value}</Text>
    </View>
  );
}

const OrderPaymentBreakdown = ({
  cartItems,
  subtotal: storedSubtotal,
  deliveryFee: storedDeliveryFee,
}: OrderPaymentBreakdownProps) => {
  const mrpTotal = useMemo(
    () => calculateTotalAmountMrp(cartItems),
    [cartItems],
  );
  const computedSubtotal = useMemo(
    () => calculateTotalAmount(cartItems),
    [cartItems],
  );

  const subtotal = storedSubtotal ?? computedSubtotal;
  const deliveryFee = storedDeliveryFee ?? getDeliveryFee(subtotal);
  const productDiscount = Math.max(0, mrpTotal - subtotal);

  return (
    <View style={styles.container}>
      <BreakdownRow
        label="Total before discount"
        value={`₹ ${formatNumber(mrpTotal)}`}
      />

      {productDiscount > 0 ? (
        <BreakdownRow
          label="Product Discount"
          value={`- ₹ ${formatNumber(productDiscount)}`}
          valueStyle={styles.discountValue}
        />
      ) : null}

      <BreakdownRow
        label="Item Total"
        value={`₹ ${formatNumber(subtotal)}`}
        labelStyle={styles.emphasisLabel}
        valueStyle={styles.emphasisValue}
      />

      <BreakdownRow
        label="Delivery Fee"
        value={
          deliveryFee === 0 ? "FREE" : `₹ ${formatNumber(deliveryFee)}`
        }
        valueStyle={
          deliveryFee === 0 ? styles.discountValue : styles.value
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  label: {
    flex: 1,
    fontFamily: "Raleway_500Medium",
    fontSize: 13,
    color: Colors.light.mediumGrey,
  },
  value: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 14,
    color: Colors.light.darkGrey,
  },
  discountValue: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 14,
    color: Colors.light.mediumGreen,
  },
  emphasisLabel: {
    fontFamily: "Raleway_600SemiBold",
    color: Colors.light.darkGrey,
  },
  emphasisValue: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 14,
    color: Colors.light.darkGrey,
  },
});

export default memo(OrderPaymentBreakdown);
