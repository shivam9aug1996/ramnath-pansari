import React, { useCallback, useState } from 'react'
import { FlatList, RefreshControl } from 'react-native'
import AdminScreen from '@/app/admin/components/AdminScreen'
import { useRouter } from 'expo-router'
import { useListOrdersQuery } from '@/redux/features/adminOrderSlice'
import { AdminOrderDocument } from '@/types/global'
import { adminListStyles, adminTheme } from '@/app/admin/theme'
import HeaderBar from '@/app/admin/components/HeaderBar'
import AdminListFilters from '@/app/admin/components/AdminListFilters'
import AdminEmptyState from '@/app/admin/components/AdminEmptyState'
import PaginationBar from '@/app/admin/components/PaginationBar'
import OrderListItem from '@/app/admin/components/OrderListItem'
import useDebounce from '@/hooks/useDebounce'

const STATUS_FILTERS = [
  { key: undefined, label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'canceled', label: 'Canceled' },
] as const

const AdminOrdersScreen = () => {
  const listRef = React.useRef<FlatList<AdminOrderDocument>>(null)
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [pullRefreshing, setPullRefreshing] = useState(false)

  React.useEffect(() => {
    setPage(1)
    listRef.current?.scrollToOffset({ offset: 0, animated: false })
  }, [status, debouncedSearch])

  const { data, isFetching, isLoading, refetch } = useListOrdersQuery({
    page,
    limit: 20,
    status,
    search: debouncedSearch || undefined,
  })

  React.useEffect(() => {
    if (pullRefreshing && !isFetching) setPullRefreshing(false)
  }, [pullRefreshing, isFetching])

  const onRefresh = useCallback(() => {
    setPullRefreshing(true)
    refetch()
  }, [refetch])

  const orders = data?.orders ?? []
  const showFilterLoading = isFetching && !pullRefreshing
  const activeFilterLabel =
    STATUS_FILTERS.find((f) => f.key === status)?.label ?? 'All'

  const summaryText = [
    activeFilterLabel,
    data?.totalPages ? `Page ${data?.currentPage ?? page} / ${data.totalPages}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <AdminScreen>
      <HeaderBar title="Orders" subtitle="Manage order status" />

      <AdminListFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search order ID, name, or phone"
        filters={[...STATUS_FILTERS]}
        activeFilterKey={status}
        onFilterChange={setStatus}
        summaryText={summaryText}
        loading={showFilterLoading}
      />

      <FlatList
        ref={listRef}
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <OrderListItem
            item={item}
            onPress={(id) => router.push(`/admin/orders/${id}`)}
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
          orders.length > 0 ? (
            <PaginationBar
              currentPage={data?.currentPage ?? page}
              totalPages={data?.totalPages}
              loading={showFilterLoading}
              onPrev={() => {
                if (isFetching || isLoading) return
                const prev = Math.max(1, (data?.currentPage ?? page) - 1)
                if (prev !== page) {
                  setPage(prev)
                  listRef.current?.scrollToOffset({ offset: 0, animated: true })
                }
              }}
              onNext={() => {
                if (isFetching || isLoading) return
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
              icon="receipt-outline"
              iconColor={adminTheme.accent}
              title="No orders found"
              subtitle={
                search || status
                  ? 'Try a different search or filter'
                  : 'Orders will appear here once customers place them'
              }
            />
          ) : null
        }
      />
    </AdminScreen>
  )
}

export default AdminOrdersScreen
