import React, { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import AdminScreen from '@/app/admin/components/AdminScreen'
import { useRouter } from 'expo-router'
import { useListAdminCategoriesQuery } from '@/redux/features/adminCategorySlice'
import { adminListStyles, adminTheme } from '@/app/admin/theme'
import HeaderBar from '@/app/admin/components/HeaderBar'
import AdminAddButton from '@/app/admin/components/AdminAddButton'
import AdminListFilters from '@/app/admin/components/AdminListFilters'
import AdminEmptyState from '@/app/admin/components/AdminEmptyState'
import CategoryListItem from '@/app/admin/components/CategoryListItem'
import useDebounce from '@/hooks/useDebounce'
import {
  buildVisibleRows,
  collectExpandableIds,
  countAllCategories,
} from './utils'

const AdminCategoriesScreen = () => {
  const router = useRouter()
  const [pullRefreshing, setPullRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const { data, isFetching, isLoading, refetch } = useListAdminCategoriesQuery()

  React.useEffect(() => {
    if (pullRefreshing && !isFetching) setPullRefreshing(false)
  }, [pullRefreshing, isFetching])

  const onRefresh = useCallback(() => {
    setPullRefreshing(true)
    refetch()
  }, [refetch])

  const categories = data?.categories ?? []
  const isSearchMode = debouncedSearch.trim().length > 0

  const rows = useMemo(
    () => buildVisibleRows(categories, expandedIds, debouncedSearch),
    [categories, expandedIds, debouncedSearch],
  )

  const totalCount = countAllCategories(categories)
  const rootCount = categories.length
  const showLoading =
    (isLoading || isFetching) && totalCount === 0 && !pullRefreshing

  const onToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const onExpandAll = useCallback(() => {
    setExpandedIds(new Set(collectExpandableIds(categories)))
  }, [categories])

  const onCollapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

  const summaryText = [
    `${rootCount} root`,
    `${totalCount} total`,
    isSearchMode ? `${rows.length} match${rows.length === 1 ? '' : 'es'}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const summaryRight =
    !isSearchMode && totalCount > 0 ? (
      <View style={adminListStyles.summaryActions}>
        <TouchableOpacity onPress={onExpandAll} hitSlop={8}>
          <Text style={adminListStyles.summaryActionText}>Expand all</Text>
        </TouchableOpacity>
        <Text style={adminListStyles.summaryDivider}>·</Text>
        <TouchableOpacity onPress={onCollapseAll} hitSlop={8}>
          <Text style={adminListStyles.summaryActionText}>Collapse</Text>
        </TouchableOpacity>
      </View>
    ) : undefined

  return (
    <AdminScreen>
      <HeaderBar
        title="Categories"
        subtitle="Store taxonomy"
        right={
          <AdminAddButton
            onPress={() => router.push('/admin/categories/create')}
            accessibilityLabel="Add category"
          />
        }
      />

      <AdminListFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search categories…"
        summaryText={summaryText}
        loading={isFetching && !pullRefreshing && totalCount > 0}
        summaryRight={summaryRight}
      />

      {showLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={adminTheme.accent} />
          <Text style={styles.centerStateText}>Loading categories…</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <CategoryListItem
              item={item}
              isSearchMode={isSearchMode}
              onPress={(id) => router.push(`/admin/categories/${id}`)}
              onToggleExpand={onToggleExpand}
            />
          )}
          contentContainerStyle={adminListStyles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={pullRefreshing}
              onRefresh={onRefresh}
              tintColor={adminTheme.accent}
              colors={[adminTheme.accent]}
              progressBackgroundColor="#fff"
            />
          }
          ListHeaderComponent={
            !isSearchMode && rows.length > 0 ? (
              <Text style={styles.hint}>
                Tap ▶ to expand · tap row to edit
              </Text>
            ) : null
          }
          ListEmptyComponent={
            !isLoading && !isFetching ? (
              <AdminEmptyState
                icon={isSearchMode ? 'search-outline' : 'folder-open-outline'}
                iconColor="#D97706"
                iconBg="#FEF3C7"
                title={isSearchMode ? 'No matches' : 'No categories yet'}
                subtitle={
                  isSearchMode
                    ? 'Try a different search term'
                    : 'Add your first category to organize products'
                }
                actionLabel={!isSearchMode ? 'Add category' : undefined}
                onAction={
                  !isSearchMode
                    ? () => router.push('/admin/categories/create')
                    : undefined
                }
              />
            ) : null
          }
        />
      )}
    </AdminScreen>
  )
}

export default AdminCategoriesScreen

const styles = StyleSheet.create({
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  centerStateText: {
    marginTop: 10,
    color: adminTheme.textSecondary,
    fontWeight: '600',
  },
  hint: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    fontSize: 11,
    color: adminTheme.textMuted,
    fontWeight: '600',
  },
})
