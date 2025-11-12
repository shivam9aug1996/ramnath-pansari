import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ORDER_STATUS_COLORS } from '@/constants/Order';

export const StatusBadge = ({ status }: { status?: string | null }) => {
  const statusKey = String(status || '') as keyof typeof ORDER_STATUS_COLORS;
  const color = ORDER_STATUS_COLORS[statusKey] || '#222';
  return (
    <View style={[styles.badge, { backgroundColor: color }]}> 
      <Text style={styles.badgeText}>{String(status || '').replaceAll('_',' ')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    textTransform: 'capitalize',
    fontWeight: '700',
  },
});

export default StatusBadge;


