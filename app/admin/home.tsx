import React, { useState } from 'react'
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Link } from 'expo-router'
import BottomSheet from '@/components/BottomSheet'
import { useLogoutMutation } from '@/redux/features/authSlice'
import { Colors } from '@/constants/Colors'
import { useSelector } from 'react-redux'
import { RootState } from '@/types/global'

const DashboardCard = ({ title, subtitle, href, emoji }: { title: string; subtitle?: string; href: any; emoji?: string }) => {
  const isDisabled = !href;
  return (
    <Link href={href} asChild>
      <TouchableOpacity style={styles.card}>
        <Text style={styles.cardEmoji}>{emoji ?? '📦'}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
        {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      </TouchableOpacity>
    </Link>
  )
}

const Home = () => {
  const [logoutConfirm, setLogoutConfirm] = useState(false)
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()
  const clearAuthDataState = useSelector((state: RootState) => state?.auth?.clearAuthData)
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brandTitle}>Ramnath Pansari</Text>
            <Text style={styles.subheading}>Admin Dashboard · Manage orders, products, categories, and users</Text>
          </View>
          <Image
            source={require('@/assets/images/splash2.png')}
            resizeMode="contain"
            style={styles.headerImage}
          />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => setLogoutConfirm(true)}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.grid}>
          <DashboardCard title="Orders" subtitle="View & edit orders" href="/admin/orders" emoji="🧾" />
          <DashboardCard title="Products" subtitle="Coming soon" href="" emoji="🛒" />
          <DashboardCard title="Categories" subtitle="Coming soon" href="" emoji="🗂️" />
          <DashboardCard title="Users" subtitle="Coming soon" href="" emoji="👤" />
        </View>
      </ScrollView>

      {logoutConfirm && (
        <BottomSheet
          onClose={() => {
            setLogoutConfirm(false)
          }}
        >
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Confirm Logout</Text>
            <Text style={styles.sheetMessage}>Are you sure you want to log out of your account?</Text>
            <View style={styles.sheetButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setLogoutConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={async () => {
                  setLogoutConfirm(false)
                  await logout({})?.unwrap()
                }}
                disabled={isLoggingOut}
              >
                <Text style={styles.logoutButtonText}>{isLoggingOut ? 'Logging out…' : 'Logout'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheet>
      )}

      {clearAuthDataState?.isLoading || isLoggingOut ? (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Logging out…</Text>
        </View>
      ): null}
    </SafeAreaView>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  ownerText: {
    marginTop: 2,
    color: '#6b7280',
    fontWeight: '600',
  },
  subheading: {
    marginTop: 4,
    color: '#555',
  },
  headerImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  logoutBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  logoutText: {
    color: Colors.light.gradientRed_1,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f7f7f7',
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardTitle: {
    marginTop: 8,
    fontWeight: '700',
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  sheetContent: {
    padding: 28,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    color: Colors.light.darkGrey,
  },
  sheetMessage: {
    textAlign: 'center',
    color: '#475569',
    marginBottom: 24,
  },
  sheetButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    color: Colors.light.darkGrey,
    fontWeight: '700',
  },
  logoutButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: Colors.light.gradientRed_1,
    borderRadius: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#111',
    fontWeight: '600',
  },
})