import { Stack } from 'expo-router'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { adminTheme } from './theme'

export default function AdminLayout() {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: adminTheme.screenBg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'ios_from_right',
          animationDuration: 0,
          contentStyle: { backgroundColor: adminTheme.screenBg },
        }}
      />
    </View>
  )
}
