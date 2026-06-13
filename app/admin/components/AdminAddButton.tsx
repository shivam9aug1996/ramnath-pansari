import React from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { adminTheme } from '@/app/admin/theme'

const AdminAddButton = ({
  onPress,
  accessibilityLabel = 'Add',
}: {
  onPress: () => void
  accessibilityLabel?: string
}) => (
  <TouchableOpacity
    onPress={onPress}
    hitSlop={8}
    style={styles.btn}
    accessibilityLabel={accessibilityLabel}
    activeOpacity={0.85}
  >
    <Ionicons name="add" size={24} color={adminTheme.accent} />
  </TouchableOpacity>
)

export default AdminAddButton

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: adminTheme.accentSoft,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
