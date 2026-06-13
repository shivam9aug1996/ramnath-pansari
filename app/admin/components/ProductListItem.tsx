import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AdminProductDocument } from '@/types/global'
import { adminListStyles, adminTheme } from '@/app/admin/theme'

const ProductListItem = ({
  item,
  onPress,
}: {
  item: AdminProductDocument
  onPress: (id: string) => void
}) => {
  const isHidden = item.discountedPrice === 0
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
          <Text style={[styles.sellingPrice, isHidden && styles.hiddenPrice]}>
            {isHidden ? 'Hidden' : `₹${item.discountedPrice}`}
          </Text>
          {hasDiscount ? <Text style={styles.mrp}>₹{item.price}</Text> : null}
        </View>
        <View style={styles.badges}>
          {item.isOutOfStock ? (
            <View style={[styles.badge, styles.badgeRed]}>
              <Text style={styles.badgeTextRed}>Out of stock</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.badgeGreen]}>
              <Text style={styles.badgeTextGreen}>In stock</Text>
            </View>
          )}
          {isHidden ? (
            <View style={[styles.badge, styles.badgeGray]}>
              <Text style={styles.badgeTextGray}>Not listed</Text>
            </View>
          ) : null}
        </View>
      </View>

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
  hiddenPrice: {
    color: adminTheme.textMuted,
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
  badgeGray: { backgroundColor: '#F1F5F9' },
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
  badgeTextGray: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
})
