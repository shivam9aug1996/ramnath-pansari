import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors } from "@/constants/Colors";
import { formatNumber } from "@/utils/utils";
import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

const getIconStyle = (label: string) => {
  switch (label.toLowerCase()) {
    case 'amount paid':
      return {
        backgroundColor: '#E0F7FA',
        iconColor: '#00ACC1',
        icon: 'cash-multiple'
      };
    case 'payment mode':
      return {
        backgroundColor: '#FFF3E0',
        iconColor: '#FB8C00',
        icon: 'credit-card-outline'
      };
    default:
      return {
        backgroundColor: '#F5F5F5',
        iconColor: '#757575',
        icon: 'information'
      };
  }
};

const PaymentDetailItem = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) => {
  const style = getIconStyle(label);

  return (
    <View style={styles.paymentItemContainer}>
      <View style={[styles.paymentIconContainer, { backgroundColor: style.backgroundColor }]}>
        <MaterialCommunityIcons
          name={style.icon}
          size={20}
          color={style.iconColor}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.paymentLabel}>{label}</Text>
        <Text style={styles.paymentValue}>
          {label.toLowerCase() === 'amount paid' ? formatNumber(value) : value}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  paymentItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 4,
  },
  paymentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  paymentLabel: {
    fontFamily: "Raleway_500Medium",
    fontSize: 13,
    color: Colors.light.mediumGrey,
    marginBottom: 4,
  },
  paymentValue: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 16,
    color: Colors.light.darkGrey,
  },
});

export default memo(PaymentDetailItem);