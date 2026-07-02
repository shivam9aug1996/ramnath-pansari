import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { adminTheme } from '@/app/admin/theme'

const HeaderBar = ({
  title,
  subtitle,
  right,
  showBack,
}: {
  title?: string
  subtitle?: string
  right?: React.ReactNode
  showBack?: boolean
}) => {
  const router = useRouter()
  const canGoBack = router.canGoBack()
  const showBackButton = showBack ?? canGoBack

  const onBack = () => {
    if (router.canGoBack()) {
      router.back()
    }
  }

  return (
    <View style={styles.header}>
      {showBackButton ? (
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          accessibilityLabel="Back"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={adminTheme.textPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.backBtnPlaceholder} />
      )}

      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {title ?? ''}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>{right ?? <View style={styles.rightSpacer} />}</View>
    </View>
  )
}

export default HeaderBar

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    backgroundColor: adminTheme.screenBg,
    gap: 8,
  },
  backBtnPlaceholder: {
    width: 40,
    height: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: adminTheme.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminTheme.shadow,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontWeight: '900',
    fontSize: 18,
    color: adminTheme.textPrimary,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: adminTheme.textSecondary,
  },
  right: {
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rightSpacer: {
    width: 40,
  },
})
