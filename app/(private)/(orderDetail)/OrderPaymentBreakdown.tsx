import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/Colors";
import { formatNumber } from "@/utils/utils";
import { getDeliveryFee } from "@/utils/deliveryFee";
import { useDeliverySettings } from "@/hooks/useDeliverySettings";
import { useCachedOffers } from "@/hooks/useCachedOffers";
import { getCartPriceBreakdown } from "@/utils/cartPriceBreakdown";
import { CartItem } from "@/types/global";

type OrderPaymentBreakdownProps = {
  cartItems: CartItem[];
  subtotal?: number;
  deliveryFee?: number;
  orderDiscount?: number;
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
  orderDiscount: storedOrderDiscount,
}: OrderPaymentBreakdownProps) => {
  const deliverySettings = useDeliverySettings();
  const cachedOffers = useCachedOffers();

  const breakdown = useMemo(
    () =>
      getCartPriceBreakdown(
        cartItems,
        cachedOffers,
        storedOrderDiscount ?? 0,
      ),
    [cartItems, cachedOffers, storedOrderDiscount],
  );

  const {
    catalogSubtotal,
    subtotal: computedSubtotal,
    appliedOrderDiscounts,
    totalSaved,
    freebies,
    hasOfferLines,
  } = breakdown;

  const subtotal = storedSubtotal ?? computedSubtotal;
  const deliveryFee =
    storedDeliveryFee ?? getDeliveryFee(subtotal, deliverySettings);
  const itemTotal = hasOfferLines ? catalogSubtotal : subtotal;

  return (
    <View style={styles.container}>
      <BreakdownRow
        label="Item Total"
        value={`₹ ${formatNumber(itemTotal)}`}
        labelStyle={styles.emphasisLabel}
        valueStyle={styles.emphasisValue}
      />

      {freebies.map((freebie, index) => {
        const lineTotal =
          (freebie.promoPrice ?? 0) * (freebie.quantity ?? 1);

        return (
          <BreakdownRow
            key={`${freebie.name}-${index}`}
            label={`Offer · ${freebie.quantity}x ${freebie.name}`}
            value={
              lineTotal > 0 ? `₹ ${formatNumber(lineTotal)}` : "FREE"
            }
            labelStyle={styles.offerLineLabel}
            valueStyle={
              lineTotal > 0 ? styles.value : styles.discountValue
            }
          />
        );
      })}

      {appliedOrderDiscounts.map((discount) => (
        <BreakdownRow
          key={discount.offerId}
          label={discount.label}
          value={`- ₹ ${formatNumber(discount.amount)}`}
          valueStyle={styles.discountValue}
        />
      ))}

      {totalSaved > 0 ? (
        <BreakdownRow
          label="You saved"
          value={`₹ ${formatNumber(totalSaved)}`}
          valueStyle={styles.discountValue}
        />
      ) : null}

      <BreakdownRow
        label="Delivery Fee"
        value={deliveryFee === 0 ? "FREE" : `₹ ${formatNumber(deliveryFee)}`}
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
  offerLineLabel: {
    paddingLeft: 8,
  },
});

export default memo(OrderPaymentBreakdown);
