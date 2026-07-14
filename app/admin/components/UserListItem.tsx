import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AdminUserDocument } from '@/types/global'
import { adminListStyles, adminTheme } from '@/app/admin/theme'

const UserListItem = ({
  item,
  onPress,
}: {
  item: AdminUserDocument
  onPress: (id: string) => void
}) => {
  const displayName = item.name?.trim() || 'Unnamed user'
  const profileUri =
    item.profileImage &&
    typeof item.profileImage === 'object' &&
    item.profileImage !== null &&
    'imageUrl' in item.profileImage
      ? String((item.profileImage as { imageUrl?: string }).imageUrl ?? '')
      : ''
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <TouchableOpacity
      style={[adminListStyles.listCard, styles.card]}
      onPress={() => onPress(item._id)}
      activeOpacity={0.75}
    >
      {profileUri ? (
        <Image source={{ uri: profileUri }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        <View style={styles.mobileRow}>
          <Ionicons name="call-outline" size={12} color={adminTheme.textMuted} />
          <Text style={styles.mobile} numberOfLines={1}>
            {item.mobileNumber}
          </Text>
        </View>
        <View style={styles.badges}>
          {item.isAdminUser ? (
            <View style={[styles.badge, styles.badgeAdmin]}>
              <Text style={styles.badgeTextAdmin}>Admin</Text>
            </View>
          ) : null}
          {item.isDriverUser ? (
            <View style={[styles.badge, styles.badgeDriver]}>
              <Text style={styles.badgeTextDriver}>Driver</Text>
            </View>
          ) : null}
          {item.isGuestUser ? (
            <View style={[styles.badge, styles.badgeGuest]}>
              <Text style={styles.badgeTextGuest}>Guest</Text>
            </View>
          ) : null}
          {!item.isAdminUser && !item.isGuestUser && !item.isDriverUser ? (
            <View style={[styles.badge, styles.badgeCustomer]}>
              <Text style={styles.badgeTextCustomer}>Customer</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </TouchableOpacity>
  )
}

export default UserListItem

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: adminTheme.border,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
  },
  initials: {
    fontSize: 18,
    fontWeight: '900',
    color: '#7C3AED',
  },
  body: { flex: 1 },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: adminTheme.textPrimary,
  },
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  mobile: {
    fontSize: 12,
    color: adminTheme.textSecondary,
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
  badgeAdmin: { backgroundColor: '#DCFCE7' },
  badgeDriver: { backgroundColor: '#CCFBF1' },
  badgeGuest: { backgroundColor: '#FEF3C7' },
  badgeCustomer: { backgroundColor: '#EFF6FF' },
  badgeTextAdmin: {
    fontSize: 10,
    fontWeight: '800',
    color: adminTheme.accent,
  },
  badgeTextDriver: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },
  badgeTextGuest: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  badgeTextCustomer: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
})
