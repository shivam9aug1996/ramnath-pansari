import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AdminProductDocument } from '@/types/global'
import { adminListStyles, adminTheme } from '@/app/admin/theme'

const ProductListItem = ({
  item,
  onPress,
  onClone,
}: {
  item: AdminProductDocument
  onPress: (id: string) => void
  onClone?: (id: string) => void
}) => {
  const isPromoOnly = Boolean(item.promoOnly)
  const hasDiscount = item.price > item.discountedPrice && item.discountedPrice > 0

  return (
    <TouchableOpacity
      style={[adminListStyles.listCard, styles.card]}
      onPress={() => onPress(item._id)}
      activeOpacity={0.75}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Ionicons name="cube-outline" size={22} color={adminTheme.textMuted} />
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.size}
          {item.brand ? ` · ${item.brand}` : ''}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.sellingPrice}>₹{item.discountedPrice}</Text>
          {hasDiscount ? <Text style={styles.mrp}>₹{item.price}</Text> : null}
        </View>
        <View style={styles.badges}>
          {item.isDeleted ? (
            <View style={[styles.badge, styles.badgeDeleted]}>
              <Text style={styles.badgeTextDeleted}>Deleted</Text>
            </View>
          ) : item.isOutOfStock ? (
            <View style={[styles.badge, styles.badgeRed]}>
              <Text style={styles.badgeTextRed}>Out of stock</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.badgeGreen]}>
              <Text style={styles.badgeTextGreen}>In stock</Text>
            </View>
          )}
          {isPromoOnly ? (
            <View style={[styles.badge, styles.badgePromo]}>
              <Text style={styles.badgeTextPromo}>Promo / freebie</Text>
            </View>
          ) : null}
          {item.productFromJio ? (
            <View style={[styles.badge, styles.badgeJio]}>
              <Text style={styles.badgeTextJio}>Jio</Text>
            </View>
          ) : null}
        </View>
      </View>

      {onClone ? (
        <TouchableOpacity
          onPress={() => onClone(item._id)}
          hitSlop={8}
          style={styles.cloneBtn}
          accessibilityLabel={`Clone ${item.name}`}
        >
          <Ionicons name="copy-outline" size={18} color="#2563EB" />
        </TouchableOpacity>
      ) : null}

      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </TouchableOpacity>
  )
}

export default ProductListItem

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  thumb: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: adminTheme.border,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  body: { flex: 1 },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: adminTheme.textPrimary,
    lineHeight: 18,
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: adminTheme.textSecondary,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  sellingPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: adminTheme.textPrimary,
  },
  mrp: {
    fontSize: 12,
    color: adminTheme.textMuted,
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeRed: { backgroundColor: '#FEE2E2' },
  badgeGreen: { backgroundColor: '#DCFCE7' },
  badgePromo: { backgroundColor: '#FCE7F3' },
  badgeJio: { backgroundColor: '#EFF6FF' },
  badgeDeleted: { backgroundColor: '#F1F5F9' },
  badgeTextRed: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B91C1C',
  },
  badgeTextGreen: {
    fontSize: 10,
    fontWeight: '800',
    color: adminTheme.accent,
  },
  badgeTextPromo: {
    fontSize: 10,
    fontWeight: '800',
    color: '#BE185D',
  },
  badgeTextJio: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  badgeTextDeleted: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  cloneBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
