import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { adminTheme } from '@/app/admin/theme'

type Props = {
  icon: keyof typeof Ionicons.glyphMap
  iconColor?: string
  iconBg?: string
  title: string
  subtitle: string
  actionLabel?: string
  onAction?: () => void
}

const AdminEmptyState = ({
  icon,
  iconColor = adminTheme.accent,
  iconBg = adminTheme.accentSoft,
  title,
  subtitle,
  actionLabel,
  onAction,
}: Props) => (
  <View style={styles.wrap}>
    <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={32} color={iconColor} />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
    {actionLabel && onAction ? (
      <TouchableOpacity style={styles.actionBtn} onPress={onAction} activeOpacity={0.85}>
        <Text style={styles.actionText}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
)

export default AdminEmptyState

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 300,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: adminTheme.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: adminTheme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  actionBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: adminTheme.accent,
  },
  actionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
})
