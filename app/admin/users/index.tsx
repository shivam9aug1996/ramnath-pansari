import React, { useCallback, useState } from 'react'
import { FlatList, RefreshControl } from 'react-native'
import AdminScreen from '@/app/admin/components/AdminScreen'
import { useRouter } from 'expo-router'
import { useListAdminUsersQuery } from '@/redux/features/adminUserSlice'
import { AdminUserDocument } from '@/types/global'
import { adminListStyles, adminTheme } from '@/app/admin/theme'
import HeaderBar from '@/app/admin/components/HeaderBar'
import AdminAddButton from '@/app/admin/components/AdminAddButton'
import AdminListFilters from '@/app/admin/components/AdminListFilters'
import AdminEmptyState from '@/app/admin/components/AdminEmptyState'
import PaginationBar from '@/app/admin/components/PaginationBar'
import UserListItem from '@/app/admin/components/UserListItem'
import useDebounce from '@/hooks/useDebounce'

const ROLE_FILTERS = [
  { key: undefined, label: 'All' },
  { key: 'admin', label: 'Admins' },
  { key: 'customer', label: 'Customers' },
  { key: 'guest', label: 'Guests' },
] as const

const AdminUsersScreen = () => {
  const listRef = React.useRef<FlatList<AdminUserDocument>>(null)
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [role, setRole] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [pullRefreshing, setPullRefreshing] = useState(false)

  React.useEffect(() => {
    setPage(1)
    listRef.current?.scrollToOffset({ offset: 0, animated: false })
  }, [role, debouncedSearch])

  const { data, isFetching, isLoading, refetch } = useListAdminUsersQuery({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    role,
  })

  React.useEffect(() => {
    if (pullRefreshing && !isFetching) setPullRefreshing(false)
  }, [pullRefreshing, isFetching])

  const onRefresh = useCallback(() => {
    setPullRefreshing(true)
    refetch()
  }, [refetch])

  const users = data?.users ?? []
  const showFilterLoading = isFetching && !pullRefreshing
  const activeRoleLabel =
    ROLE_FILTERS.find((f) => f.key === role)?.label ?? 'All'

  const summaryText = [
    activeRoleLabel,
    `${data?.totalCount ?? 0} users`,
    data?.totalPages ? `Page ${data?.currentPage ?? page} / ${data.totalPages}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <AdminScreen>
      <HeaderBar
        title="Users"
        subtitle="Accounts & access"
        right={
          <AdminAddButton
            onPress={() => router.push('/admin/users/create')}
            accessibilityLabel="Add user"
          />
        }
      />

      <AdminListFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name or mobile…"
        filters={[...ROLE_FILTERS]}
        activeFilterKey={role}
        onFilterChange={setRole}
        summaryText={summaryText}
        loading={showFilterLoading}
      />

      <FlatList
        ref={listRef}
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <UserListItem
            item={item}
            onPress={(id) => router.push(`/admin/users/${id}`)}
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
          users.length > 0 ? (
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
              icon="people-outline"
              iconColor="#7C3AED"
              iconBg="#EDE9FE"
              title="No users found"
              subtitle={
                search || role ? 'Try different filters' : 'Add your first user account'
              }
              actionLabel={!search && !role ? 'Add user' : undefined}
              onAction={
                !search && !role ? () => router.push('/admin/users/create') : undefined
              }
            />
          ) : null
        }
      />
    </AdminScreen>
  )
}

export default AdminUsersScreen
