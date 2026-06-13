import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AdminOrderDocument } from '@/types/global'
import { ORDER_STATUS_COLORS } from '@/constants/Order'
import { adminListStyles, adminTheme } from '@/app/admin/theme'
import StatusBadge from './StatusBadge'

const OrderListItem = ({
  item,
  onPress,
}: {
  item: AdminOrderDocument
  onPress: (id: string) => void
}) => {
  const createdAt = item?.createdAt ? new Date(item.createdAt) : undefined
  const dateStr = createdAt
    ? createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : ''
  const timeStr = createdAt
    ? createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : ''
  const customerName = item?.addressData?.name || 'Customer'
  const phone = item?.addressData?.phone || ''
  const subtotal = item?.subtotal
  const deliveryFee = item?.deliveryFee
  const amount = item?.amountPaid ?? item?.transactionData?.amount
  const itemCount = item.totalProductCount ?? item.productCount ?? 0
  const statusKey = String(item.orderStatus || '') as keyof typeof ORDER_STATUS_COLORS
  const accentColor = ORDER_STATUS_COLORS[statusKey] || '#94A3B8'
  const previewImages = (item.imgArr ?? []).slice(0, 3)

  return (
    <TouchableOpacity
      style={[adminListStyles.listCard, styles.card]}
      onPress={() => onPress(item._id)}
      activeOpacity={0.75}
    >
      <View style={[styles.accent, { backgroundColor: accentColor }]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <View style={styles.orderIdRow}>
              <Ionicons name="receipt-outline" size={14} color={accentColor} />
              <Text style={styles.orderId}>{item.orderId}</Text>
            </View>
            <Text style={styles.customer}>{customerName}</Text>
            {phone ? <Text style={styles.phone}>{phone}</Text> : null}
          </View>
          <StatusBadge status={String(item.orderStatus)} />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {dateStr} · {timeStr}
          </Text>
          <Text style={styles.amount}>₹{amount}</Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.itemChip}>
            <Text style={styles.itemChipText}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
          {subtotal != null && deliveryFee != null ? (
            <Text style={styles.feeHint}>
              ₹{subtotal} + {deliveryFee === 0 ? 'free delivery' : `₹${deliveryFee} delivery`}
            </Text>
          ) : null}
        </View>

        {previewImages.length > 0 ? (
          <View style={styles.thumbRow}>
            {previewImages.map((uri, i) => (
              <Image key={`${uri}-${i}`} source={{ uri }} style={styles.thumb} />
            ))}
          </View>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" style={styles.chevron} />
    </TouchableOpacity>
  )
}

export default OrderListItem

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingRight: 10,
  },
  accent: {
    width: 5,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    padding: 14,
    paddingRight: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  topLeft: {
    flex: 1,
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderId: {
    fontWeight: '800',
    fontSize: 14,
    color: adminTheme.textPrimary,
  },
  customer: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  phone: {
    marginTop: 2,
    fontSize: 12,
    color: adminTheme.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  meta: {
    fontSize: 12,
    color: adminTheme.textSecondary,
    fontWeight: '500',
  },
  amount: {
    fontSize: 17,
    fontWeight: '900',
    color: adminTheme.textPrimary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  itemChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  itemChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  feeHint: {
    flex: 1,
    fontSize: 11,
    color: adminTheme.textMuted,
    textAlign: 'right',
  },
  thumbRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  thumb: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: adminTheme.border,
  },
  chevron: {
    marginRight: 2,
  },
})
