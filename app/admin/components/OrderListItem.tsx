import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AdminOrderDocument } from '@/types/global';
import StatusBadge from './StatusBadge';

const OrderListItem = ({ item, onPress }: { item: AdminOrderDocument; onPress: (id: string) => void }) => {
  const createdAt = item?.createdAt ? new Date(item.createdAt) : undefined;
  const dateStr = createdAt ? createdAt.toLocaleDateString() : '';
  const timeStr = createdAt ? createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item._id)}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.orderId}>{item.orderId}</Text>
        <StatusBadge status={String(item.orderStatus)} />
      </View>
      <Text style={styles.meta}>Date: {dateStr} · {timeStr}</Text>
      <Text style={styles.meta}>Amount: ₹{item.transactionData?.amount}</Text>
      <Text style={styles.meta}>Items: {item.totalProductCount ?? item.productCount ?? (item as any)?.cartData?.cart?.items?.length}</Text>
      <Text style={styles.meta}>User: {item.userId}</Text>
    </TouchableOpacity>
  );
};

export default OrderListItem;

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 8, backgroundColor: '#f8f8f8', marginBottom: 10 },
  orderId: { fontWeight: '600', fontSize: 14 },
  meta: { marginTop: 6, fontSize: 12, color: '#333' },
});


