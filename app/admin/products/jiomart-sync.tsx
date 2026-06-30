import React, { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import AdminScreen from '@/app/admin/components/AdminScreen'
import HeaderBar from '@/app/admin/components/HeaderBar'
import {
  useListJiomartSyncCategoriesQuery,
  useSyncJiomartProductsMutation,
} from '@/redux/features/adminProductSlice'
import { JiomartSyncCategory, JiomartSyncResponse } from '@/types/global'
import { adminListStyles, adminTheme } from '@/app/admin/theme'
import useDebounce from '@/hooks/useDebounce'

const isSelectable = (item: JiomartSyncCategory) =>
  item.syncAvailable && item.storeCategoryFound

const JiomartSyncScreen = () => {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [wipeAll, setWipeAll] = useState(false)
  const [pullRefreshing, setPullRefreshing] = useState(false)
  const [lastResult, setLastResult] = useState<JiomartSyncResponse | null>(null)

  const { data, isFetching, isLoading, refetch } = useListJiomartSyncCategoriesQuery()
  const [syncProducts, { isLoading: isSyncing }] = useSyncJiomartProductsMutation()

  React.useEffect(() => {
    if (pullRefreshing && !isFetching) setPullRefreshing(false)
  }, [pullRefreshing, isFetching])

  const onRefresh = useCallback(() => {
    setPullRefreshing(true)
    refetch()
  }, [refetch])

  const categories = data?.categories ?? []

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    if (!q) return categories
    return categories.filter((item) => item.name.toLowerCase().includes(q))
  }, [categories, debouncedSearch])

  const selectableCategories = useMemo(
    () => categories.filter(isSelectable),
    [categories],
  )

  const toggleCategory = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const selectAllSyncable = () => {
    setSelected(new Set(selectableCategories.map((c) => c.name)))
  }

  const clearSelection = () => setSelected(new Set())

  const showSyncResult = (result: JiomartSyncResponse) => {
    const lines = result.results.map((row) => {
      if (row.error) return `• ${row.category}: ${row.error}`
      return `• ${row.category}: ${row.syncedProducts} synced (${row.totalProducts} total)`
    })
    Alert.alert(
      result.summary.failed > 0 ? 'Sync completed with errors' : 'Sync completed',
      [
        `Succeeded: ${result.summary.succeeded}`,
        `Failed: ${result.summary.failed}`,
        '',
        ...lines.slice(0, 12),
        lines.length > 12 ? `…and ${lines.length - 12} more` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    )
  }

  const runSync = async (payload: {
    categories?: string[]
    syncAll?: boolean
  }) => {
    try {
      const result = await syncProducts({
        ...payload,
        wipeAll,
      }).unwrap()
      setLastResult(result)
      setSelected(new Set())
      refetch()
      showSyncResult(result)
    } catch (e: unknown) {
      const err = e as {
        data?: { error?: { message?: string }; results?: JiomartSyncResponse['results'] }
      }
      const msg = err?.data?.error?.message ?? 'Sync failed'
      Alert.alert('Sync failed', msg)
    }
  }

  const confirmAndSync = (payload: { categories?: string[]; syncAll?: boolean }) => {
    const count = payload.syncAll
      ? selectableCategories.length
      : payload.categories?.length ?? 0

    if (!payload.syncAll && count === 0) {
      Alert.alert('Nothing selected', 'Pick at least one category to sync.')
      return
    }

    const title = wipeAll ? 'Wipe & re-sync?' : 'Start JioMart sync?'
    const message = wipeAll
      ? `This deletes Jio products only and re-imports ${payload.syncAll ? 'all syncable' : count} categories. Manual/promo products are kept. All carts will be cleared.`
      : `Sync ${payload.syncAll ? 'all syncable' : count} categor${count === 1 ? 'y' : 'ies'} from JioMart?`

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: wipeAll ? 'Wipe & sync' : 'Sync',
        style: wipeAll ? 'destructive' : 'default',
        onPress: () => runSync(payload),
      },
    ])
  }

  const renderItem = ({ item }: { item: JiomartSyncCategory }) => {
    const selectable = isSelectable(item)
    const checked = selected.has(item.name)

    return (
      <TouchableOpacity
        style={[styles.row, !selectable && styles.rowDisabled]}
        onPress={() => selectable && toggleCategory(item.name)}
        activeOpacity={selectable ? 0.75 : 1}
        disabled={!selectable || isSyncing}
      >
        <View
          style={[
            styles.checkbox,
            checked && styles.checkboxChecked,
            !selectable && styles.checkboxDisabled,
          ]}
        >
          {checked ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
        </View>

        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{item.name}</Text>
          <Text style={styles.rowMeta}>
            {item.productCount} products in store
            {!item.storeCategoryFound ? ' · missing in categories tree' : ''}
            {!item.syncAvailable ? ' · no JioMart mapping' : ''}
          </Text>
        </View>

        {item.syncAvailable ? (
          <View style={styles.readyBadge}>
            <Text style={styles.readyBadgeText}>Ready</Text>
          </View>
        ) : (
          <View style={styles.skipBadge}>
            <Text style={styles.skipBadgeText}>N/A</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <AdminScreen>
      <HeaderBar title="JioMart sync" subtitle="Import catalog from JioMart" />

      <View style={adminListStyles.filtersPanel}>
        <View style={adminListStyles.searchWrap}>
          <Ionicons
            name="search"
            size={18}
            color={adminTheme.textMuted}
            style={adminListStyles.searchIcon}
          />
          <TextInput
            placeholder="Search categories…"
            placeholderTextColor={adminTheme.textMuted}
            value={search}
            onChangeText={setSearch}
            style={adminListStyles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={adminTheme.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.summaryRow}>
          <Text style={adminListStyles.summaryText}>
            {data?.syncAvailableCount ?? 0} syncable · {selected.size} selected ·{' '}
            {filtered.length} shown
          </Text>
          {isFetching && !pullRefreshing ? (
            <ActivityIndicator size="small" color={adminTheme.accent} />
          ) : null}
        </View>

        <View style={styles.actionLinks}>
          <TouchableOpacity onPress={selectAllSyncable} hitSlop={8} disabled={isSyncing}>
            <Text style={styles.linkText}>Select all syncable</Text>
          </TouchableOpacity>
          <Text style={adminListStyles.summaryDivider}>·</Text>
          <TouchableOpacity onPress={clearSelection} hitSlop={8} disabled={isSyncing}>
            <Text style={styles.linkText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.wipeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.wipeLabel}>Wipe all products first</Text>
            <Text style={styles.wipeHint}>Deletes entire catalog before import</Text>
          </View>
          <Switch
            value={wipeAll}
            onValueChange={setWipeAll}
            trackColor={{ false: '#E2E8F0', true: '#FCA5A5' }}
            thumbColor="#fff"
            disabled={isSyncing}
          />
        </View>
      </View>

      {lastResult ? (
        <View style={styles.resultBanner}>
          <Text style={styles.resultBannerText}>
            Last sync: {lastResult.summary.succeeded} ok · {lastResult.summary.failed} failed
          </Text>
        </View>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.name}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={onRefresh}
            tintColor={adminTheme.accent}
            colors={[adminTheme.accent]}
            progressBackgroundColor="#fff"
          />
        }
        ListEmptyComponent={
          !isLoading && !isFetching ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No categories match your search</Text>
            </View>
          ) : null
        }
      />

      <View style={styles.footer}>
        {isSyncing ? (
          <View style={styles.syncingRow}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.syncingText}>Syncing with JioMart…</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.footerBtn, styles.footerBtnSecondary, selected.size === 0 && styles.footerBtnDisabled]}
              onPress={() =>
                confirmAndSync({ categories: Array.from(selected) })
              }
              disabled={selected.size === 0}
            >
              <Text style={styles.footerBtnSecondaryText}>
                Sync selected ({selected.size})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerBtn, styles.footerBtnPrimary]}
              onPress={() => confirmAndSync({ syncAll: true })}
            >
              <Ionicons name="cloud-download-outline" size={18} color="#fff" />
              <Text style={styles.footerBtnPrimaryText}>Sync all</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </AdminScreen>
  )
}

export default JiomartSyncScreen

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
    color: adminTheme.accent,
  },
  wipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
  },
  wipeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: adminTheme.textPrimary,
  },
  wipeHint: {
    marginTop: 2,
    fontSize: 11,
    color: adminTheme.textSecondary,
  },
  resultBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  resultBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminTheme.border,
    padding: 12,
    marginBottom: 8,
    ...adminTheme.shadow,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: adminTheme.accent,
    borderColor: adminTheme.accent,
  },
  checkboxDisabled: {
    backgroundColor: '#F1F5F9',
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: adminTheme.textPrimary,
  },
  rowMeta: {
    marginTop: 3,
    fontSize: 11,
    color: adminTheme.textSecondary,
    lineHeight: 15,
  },
  readyBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  readyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: adminTheme.accent,
  },
  skipBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  skipBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  emptyWrap: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: adminTheme.textSecondary,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: adminTheme.border,
    ...adminTheme.shadow,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  footerBtnPrimary: {
    backgroundColor: adminTheme.accent,
  },
  footerBtnSecondary: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: adminTheme.border,
  },
  footerBtnDisabled: {
    opacity: 0.45,
  },
  footerBtnPrimaryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  footerBtnSecondaryText: {
    color: adminTheme.textPrimary,
    fontWeight: '800',
    fontSize: 13,
  },
  syncingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: adminTheme.accent,
    borderRadius: 14,
    paddingVertical: 14,
  },
  syncingText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
})
