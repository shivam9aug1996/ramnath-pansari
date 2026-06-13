import React, { useCallback, useState } from 'react'
import { FlatList, RefreshControl, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import AdminScreen from '@/app/admin/components/AdminScreen'
import { useRouter } from 'expo-router'
import { useListAdminProductsQuery } from '@/redux/features/adminProductSlice'
import { AdminProductDocument } from '@/types/global'
import { adminListStyles, adminTheme } from '@/app/admin/theme'
import HeaderBar from '@/app/admin/components/HeaderBar'
import AdminAddButton from '@/app/admin/components/AdminAddButton'
import AdminListFilters from '@/app/admin/components/AdminListFilters'
import AdminEmptyState from '@/app/admin/components/AdminEmptyState'
import PaginationBar from '@/app/admin/components/PaginationBar'
import ProductListItem from '@/app/admin/components/ProductListItem'
import useDebounce from '@/hooks/useDebounce'

const STOCK_FILTERS = [
  { key: undefined, label: 'All' },
  { key: 'in_stock', label: 'In stock' },
  { key: 'out_of_stock', label: 'Out of stock' },
  { key: 'hidden', label: 'Hidden' },
] as const

const AdminProductsScreen = () => {
  const listRef = React.useRef<FlatList<AdminProductDocument>>(null)
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [stock, setStock] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [pullRefreshing, setPullRefreshing] = useState(false)

  React.useEffect(() => {
    setPage(1)
    listRef.current?.scrollToOffset({ offset: 0, animated: false })
  }, [stock, debouncedSearch])

  const { data, isFetching, isLoading, refetch } = useListAdminProductsQuery({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    stock,
  })

  React.useEffect(() => {
    if (pullRefreshing && !isFetching) setPullRefreshing(false)
  }, [pullRefreshing, isFetching])

  const onRefresh = useCallback(() => {
    setPullRefreshing(true)
    refetch()
  }, [refetch])

  const products = data?.products ?? []
  const showFilterLoading = isFetching && !pullRefreshing
  const activeStockLabel =
    STOCK_FILTERS.find((f) => f.key === stock)?.label ?? 'All'

  const summaryText = [
    activeStockLabel,
    `${data?.totalCount ?? 0} products`,
    data?.totalPages ? `Page ${data?.currentPage ?? page} / ${data.totalPages}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <AdminScreen>
      <HeaderBar
        title="Products"
        subtitle="Catalog & pricing"
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push('/admin/products/jiomart-sync')}
              hitSlop={8}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: '#EFF6FF',
                borderWidth: 1,
                borderColor: '#BFDBFE',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityLabel="Sync with JioMart"
            >
              <Ionicons name="cloud-download-outline" size={20} color="#2563EB" />
            </TouchableOpacity>
            <AdminAddButton
              onPress={() => router.push('/admin/products/create')}
              accessibilityLabel="Add product"
            />
          </View>
        }
      />

      <AdminListFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, brand, SKU…"
        filters={[...STOCK_FILTERS]}
        activeFilterKey={stock}
        onFilterChange={setStock}
        summaryText={summaryText}
        loading={showFilterLoading}
      />

      <FlatList
        ref={listRef}
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ProductListItem
            item={item}
            onPress={(id) => router.push(`/admin/products/${id}`)}
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
        ListFooterComponent={
          products.length > 0 ? (
            <PaginationBar
              currentPage={data?.currentPage ?? page}
              totalPages={data?.totalPages}
              loading={showFilterLoading}
              onPrev={() => {
                if (isFetching) return
                const prev = Math.max(1, (data?.currentPage ?? page) - 1)
                if (prev !== page) {
                  setPage(prev)
                  listRef.current?.scrollToOffset({ offset: 0, animated: true })
                }
              }}
              onNext={() => {
                if (isFetching) return
                const next = (data?.currentPage ?? page) + 1
                if (next <= (data?.totalPages ?? 1)) {
                  setPage(next)
                  listRef.current?.scrollToOffset({ offset: 0, animated: true })
                }
              }}
            />
          ) : null
        }
        ListEmptyComponent={
          !isLoading && !isFetching ? (
            <AdminEmptyState
              icon="cube-outline"
              iconColor="#2563EB"
              iconBg="#DBEAFE"
              title="No products found"
              subtitle={
                search || stock ? 'Try different filters' : 'Add your first product to the catalog'
              }
              actionLabel={!search && !stock ? 'Add product' : undefined}
              onAction={
                !search && !stock
                  ? () => router.push('/admin/products/create')
                  : undefined
              }
            />
          ) : null
        }
      />
    </AdminScreen>
  )
}

export default AdminProductsScreen
