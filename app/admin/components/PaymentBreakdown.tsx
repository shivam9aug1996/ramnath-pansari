import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  subtotal?: number;
  deliveryFee?: number;
  amountPaid?: string | number;
};

const PaymentBreakdown = ({ subtotal = 0, deliveryFee = 0, amountPaid }: Props) => (
  <View style={styles.container}>
    <View style={styles.row}>
      <Text style={styles.label}>Item total</Text>
      <Text style={styles.value}>₹{subtotal}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Delivery fee</Text>
      <Text style={[styles.value, deliveryFee === 0 && styles.freeText]}>
        {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
      </Text>
    </View>
    <View style={[styles.row, styles.totalRow]}>
      <Text style={styles.totalLabel}>Order total</Text>
      <Text style={styles.totalValue}>₹{amountPaid ?? '—'}</Text>
    </View>
  </View>
);

export default PaymentBreakdown;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  label: { fontSize: 13, color: '#64748B' },
  value: { fontSize: 14, fontWeight: '600', color: '#111827' },
  freeText: { color: '#22C55E', fontWeight: '700' },
  totalRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  totalValue: { fontSize: 17, fontWeight: '800', color: '#111827' },
});
