import React from 'react'
import { View, ViewStyle } from 'react-native'
import { adminListStyles } from '@/app/admin/theme'

type AdminScreenProps = {
  children: React.ReactNode
  style?: ViewStyle
}

/** Root screen container — safe area is applied in admin/_layout.tsx */
const AdminScreen = ({ children, style }: AdminScreenProps) => (
  <View style={[adminListStyles.screen, style]}>{children}</View>
)

export default AdminScreen
