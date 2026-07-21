import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import AdminScreen from '@/app/admin/components/AdminScreen'
import { Link } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Ionicons from '@expo/vector-icons/Ionicons'
import BottomSheet from '@/components/BottomSheet'
import { logoutSession } from '@/redux/features/authSlice'
import { useGetAdminStatsQuery } from '@/redux/features/adminOrderSlice'
import { Colors } from '@/constants/Colors'
import { useSelector } from 'react-redux'
import { RootState, AdminStatsResponse } from '@/types/global'
import {
  finalizeStartupReady,
  markStartupCheckpoint,
} from '@/utils/startupDiagnostics'
import { useDispatch } from 'react-redux'

type ActionCardProps = {
  title: string
  subtitle: string
  href: string
  icon: keyof typeof Ionicons.glyphMap
  tint: string
  iconBg: string
}

const ActionCard = ({
  title,
  subtitle,
  href,
  icon,
  tint,
  iconBg,
}: ActionCardProps) => (
  <Link href={href as any} asChild>
    <TouchableOpacity style={styles.actionCard} activeOpacity={0.75}>
      <View style={[styles.actionIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={tint} />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle} numberOfLines={2}>
        {subtitle}
      </Text>
      <View style={styles.actionArrow}>
        <Ionicons name="arrow-forward" size={14} color={tint} />
      </View>
    </TouchableOpacity>
  </Link>
)

type SnapshotCardProps = {
  title: string
  subtitle: string
  href: string
  icon: keyof typeof Ionicons.glyphMap
  accent: string
  tintBg: string
  primaryValue: number
  primaryLabel: string
  metrics: { label: string; value: number }[]
}

const SnapshotCard = ({
  title,
  subtitle,
  href,
  icon,
  accent,
  tintBg,
  primaryValue,
  primaryLabel,
  metrics,
}: SnapshotCardProps) => (
  <Link href={href as any} asChild>
    <TouchableOpacity style={styles.snapshotCard} activeOpacity={0.82}>
      <View style={[styles.snapshotAccent, { backgroundColor: accent }]} />
      <View style={styles.snapshotBody}>
        <View style={styles.snapshotTopRow}>
          <View style={[styles.snapshotIconWrap, { backgroundColor: tintBg }]}>
            <Ionicons name={icon} size={18} color={accent} />
          </View>
          <View style={styles.snapshotTitleWrap}>
            <Text style={styles.snapshotCardTitle}>{title}</Text>
            <Text style={styles.snapshotCardSubtitle}>{subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
        </View>

        <View style={styles.snapshotHero}>
          <Text style={[styles.snapshotHeroValue, { color: accent }]}>
            {primaryValue}
          </Text>
          <Text style={styles.snapshotHeroLabel}>{primaryLabel}</Text>
        </View>

        <View style={styles.snapshotMetricsRow}>
          {metrics.map((metric, index) => (
            <React.Fragment key={metric.label}>
              {index > 0 ? <View style={styles.snapshotMetricDivider} /> : null}
              <View style={styles.snapshotMetric}>
                <Text style={styles.snapshotMetricValue}>{metric.value}</Text>
                <Text style={styles.snapshotMetricLabel} numberOfLines={1}>
                  {metric.label}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  </Link>
)

const StoreSnapshot = ({
  stats,
  showRefreshIndicator,
}: {
  stats?: AdminStatsResponse
  showRefreshIndicator: boolean
}) => (
  <View style={styles.snapshotSection}>
    <View style={styles.snapshotSectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.snapshotSectionTitle}>Store snapshot</Text>
        <Text style={styles.snapshotSectionSubtitle}>
          Live overview across your store
        </Text>
      </View>
      {showRefreshIndicator ? (
        <View style={styles.refreshingBadge}>
          <ActivityIndicator size="small" color={Colors.light.darkGreen} />
          <Text style={styles.refreshingText}>Updating</Text>
        </View>
      ) : (
        <View style={styles.liveDot}>
          <View style={styles.liveDotInner} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      )}
    </View>

    <View style={styles.snapshotGrid}>
      <SnapshotCard
        title="Orders"
        subtitle="Fulfillment pipeline"
        href="/admin/orders"
        icon="receipt-outline"
        accent={Colors.light.darkGreen}
        tintBg="#DCFCE7"
        primaryValue={stats?.today ?? 0}
        primaryLabel="Orders today"
        metrics={[
          { label: 'Total', value: stats?.total ?? 0 },
          { label: 'Confirmed', value: stats?.byStatus?.confirmed ?? 0 },
          { label: 'Delivering', value: stats?.byStatus?.out_for_delivery ?? 0 },
        ]}
      />
      <SnapshotCard
        title="Products"
        subtitle="Catalog health"
        href="/admin/products"
        icon="cube-outline"
        accent="#2563EB"
        tintBg="#DBEAFE"
        primaryValue={stats?.products?.total ?? 0}
        primaryLabel="Total products"
        metrics={[
          { label: 'In stock', value: stats?.products?.inStock ?? 0 },
          { label: 'Out', value: stats?.products?.outOfStock ?? 0 },
          { label: 'Promo', value: stats?.products?.promoOnly ?? 0 },
        ]}
      />
      <SnapshotCard
        title="Categories"
        subtitle="Store structure"
        href="/admin/categories"
        icon="folder-open-outline"
        accent="#D97706"
        tintBg="#FEF3C7"
        primaryValue={stats?.categories?.total ?? 0}
        primaryLabel="All categories"
        metrics={[
          { label: 'Root', value: stats?.categories?.root ?? 0 },
          { label: 'Leaf', value: stats?.categories?.leaf ?? 0 },
          {
            label: 'Nested',
            value:
              (stats?.categories?.total ?? 0) - (stats?.categories?.leaf ?? 0),
          },
        ]}
      />
      <SnapshotCard
        title="Users"
        subtitle="Accounts & roles"
        href="/admin/users"
        icon="people-outline"
        accent="#7C3AED"
        tintBg="#EDE9FE"
        primaryValue={stats?.users?.total ?? 0}
        primaryLabel="Registered users"
        metrics={[
          { label: 'Admins', value: stats?.users?.admins ?? 0 },
          { label: 'Customers', value: stats?.users?.customers ?? 0 },
          { label: 'Guests', value: stats?.users?.guests ?? 0 },
        ]}
      />
    </View>
  </View>
)

const Home = () => {
  const dispatch = useDispatch();
  const [logoutConfirm, setLogoutConfirm] = useState(false)

  const logoutSessionPending = useSelector(
    (state: RootState) => state.auth?.logoutSessionPending,
  );
  const isLoggingOut = logoutSessionPending;
  const adminName = useSelector(
    (state: RootState) => state?.auth?.userData?.name,
  )
  const token = useSelector((state: RootState) => state?.auth?.token)
  const isAdminUser = useSelector(
    (state: RootState) => state?.auth?.userData?.isAdminUser,
  )
  const { data: stats, isFetching, refetch } = useGetAdminStatsQuery(undefined, {
    skip: !token || !isAdminUser,
  })
  const [pullRefreshing, setPullRefreshing] = useState(false)

  useEffect(() => {
    markStartupCheckpoint('home_mounted', { screen: 'admin_home' }).catch(
      () => {},
    )
    finalizeStartupReady({ screen: 'admin_home' }).catch(() => {})
  }, [])

  useEffect(() => {
    if (pullRefreshing && !isFetching) {
      setPullRefreshing(false)
    }
  }, [pullRefreshing, isFetching])

  const onRefresh = useCallback(() => {
    setPullRefreshing(true)
    refetch()
  }, [refetch])

  const showRefreshIndicator = pullRefreshing || isFetching

  const firstName = adminName?.split(' ')[0]
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      }),
    [],
  )

  const pulseStats = [
    { label: 'Today', value: stats?.today ?? 0 },
    { label: 'Confirmed', value: stats?.byStatus?.confirmed ?? 0 },
    { label: 'Delivering', value: stats?.byStatus?.out_for_delivery ?? 0 },
  ]

  return (
    <AdminScreen style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.darkGreen}
            colors={[Colors.light.darkGreen]}
            progressBackgroundColor="#fff"
          />
        }
      >
        <LinearGradient
          colors={[Colors.light.darkGreen, Colors.light.gradientGreen_2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroBrandRow}>
              <Image
                source={require('@/assets/images/splash2.png')}
                resizeMode="contain"
                style={styles.heroLogo}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.heroBrand}>Ramnath Pansari</Text>
                <Text style={styles.heroTagline}>Admin control panel</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.heroLogoutBtn}
              onPress={() => setLogoutConfirm(true)}
              hitSlop={8}
              disabled={isLoggingOut}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroGreeting}>
            Hi{firstName ? `, ${firstName}` : ''} 👋
          </Text>
          <Text style={styles.heroDate}>{todayLabel}</Text>

          <View style={styles.pulseRow}>
            {pulseStats.map((item) => (
              <View key={item.label} style={styles.pulseChip}>
                <Text style={styles.pulseValue}>{item.value}</Text>
                <Text style={styles.pulseLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.actionGrid}>
            <ActionCard
              title="Orders"
              subtitle="View & update status"
              href="/admin/orders"
              icon="receipt-outline"
              tint="#194B38"
              iconBg="#DCFCE7"
            />
            <ActionCard
              title="Products"
              subtitle="Catalog & pricing"
              href="/admin/products"
              icon="cube-outline"
              tint="#1D4ED8"
              iconBg="#DBEAFE"
            />
            <ActionCard
              title="Categories"
              subtitle="Store taxonomy"
              href="/admin/categories"
              icon="folder-open-outline"
              tint="#B45309"
              iconBg="#FEF3C7"
            />
            <ActionCard
              title="Users"
              subtitle="Accounts & access"
              href="/admin/users"
              icon="people-outline"
              tint="#7C3AED"
              iconBg="#EDE9FE"
            />
            <ActionCard
              title="Offers"
              subtitle="Promos & milestones"
              href="/admin/offers"
              icon="gift-outline"
              tint="#BE185D"
              iconBg="#FCE7F3"
            />
            <ActionCard
              title="Carousel"
              subtitle="Home banner slides"
              href="/admin/carousel"
              icon="images-outline"
              tint="#0F766E"
              iconBg="#CCFBF1"
            />
            <ActionCard
              title="Delivery"
              subtitle="Shipping & free delivery"
              href="/admin/delivery-settings"
              icon="bicycle-outline"
              tint="#2563EB"
              iconBg="#DBEAFE"
            />
            <ActionCard
              title="Store"
              subtitle="Hours & delivery radius"
              href="/admin/store-settings"
              icon="time-outline"
              tint="#7C3AED"
              iconBg="#EDE9FE"
            />
            <ActionCard
              title="Sync versions"
              subtitle="Force client cache refresh"
              href="/admin/sync-versions"
              icon="sync-outline"
              tint="#0F766E"
              iconBg="#CCFBF1"
            />
          </View>
        </View>

        <StoreSnapshot stats={stats} showRefreshIndicator={showRefreshIndicator} />
      </ScrollView>

      {logoutConfirm && (
        <BottomSheet onClose={() => setLogoutConfirm(false)}>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Confirm Logout</Text>
            <Text style={styles.sheetMessage}>
              Are you sure you want to log out of your account?
            </Text>
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
                  await dispatch(logoutSession() as any).unwrap()
                }}
                disabled={isLoggingOut}
              >
                <Text style={styles.logoutButtonText}>
                  {isLoggingOut ? 'Logging out…' : 'Logout'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheet>
      )}

      {isLoggingOut ? (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Logging out…</Text>
        </View>
      ) : null}
    </AdminScreen>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F6',
  },
  content: {
    paddingBottom: 32,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroBrandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroLogo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroBrand: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  heroTagline: {
    marginTop: 2,
    fontSize: 12,
    color: 'rgba(255,255,255,0.82)',
    fontWeight: '600',
  },
  heroLogoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGreeting: {
    marginTop: 20,
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  heroDate: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  pulseRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  pulseChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  pulseValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
  },
  pulseLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47.5%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8EDF3',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    minHeight: 130,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  actionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    flex: 1,
  },
  actionArrow: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  snapshotSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  snapshotSectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  snapshotSectionSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  snapshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  snapshotCard: {
    width: '47.5%',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8EDF3',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    minHeight: 168,
  },
  snapshotAccent: {
    height: 4,
    width: '100%',
  },
  snapshotBody: {
    flex: 1,
    padding: 12,
  },
  snapshotTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  snapshotIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotTitleWrap: {
    flex: 1,
  },
  snapshotCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  snapshotCardSubtitle: {
    marginTop: 1,
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  snapshotHero: {
    marginTop: 14,
    marginBottom: 12,
  },
  snapshotHeroValue: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
  },
  snapshotHeroLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  snapshotMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  snapshotMetric: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  snapshotMetricDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  snapshotMetricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  snapshotMetricLabel: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
  },
  liveDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  liveDotInner: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.light.gradientGreen_2,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.darkGreen,
  },
  refreshingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  refreshingText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.darkGreen,
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
