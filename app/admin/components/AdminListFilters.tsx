import React from 'react'
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { adminListStyles, adminTheme } from '@/app/admin/theme'

export type AdminFilterOption = {
  key: string | undefined
  label: string
}

type Props = {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  summaryText: string
  loading?: boolean
  filters?: AdminFilterOption[]
  activeFilterKey?: string
  onFilterChange?: (key: string | undefined) => void
  summaryRight?: React.ReactNode
}

const AdminListFilters = ({
  search,
  onSearchChange,
  searchPlaceholder,
  summaryText,
  loading,
  filters,
  activeFilterKey,
  onFilterChange,
  summaryRight,
}: Props) => (
  <View style={adminListStyles.filtersPanel}>
    <View style={adminListStyles.searchWrap}>
      <Ionicons
        name="search"
        size={18}
        color={adminTheme.textMuted}
        style={adminListStyles.searchIcon}
      />
      <TextInput
        placeholder={searchPlaceholder}
        placeholderTextColor={adminTheme.textMuted}
        value={search}
        onChangeText={onSearchChange}
        style={adminListStyles.searchInput}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {search.length > 0 ? (
        <TouchableOpacity onPress={() => onSearchChange('')} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={adminTheme.textMuted} />
        </TouchableOpacity>
      ) : null}
    </View>

    {filters && filters.length > 0 && onFilterChange ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={adminListStyles.pillRow}
      >
        {filters.map((filter) => {
          const active = filter.key === activeFilterKey
          return (
            <TouchableOpacity
              key={filter.label}
              onPress={() => onFilterChange(filter.key)}
              style={[adminListStyles.pill, active && adminListStyles.pillActive]}
            >
              <Text
                style={[
                  adminListStyles.pillText,
                  active && adminListStyles.pillTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    ) : null}

    <View style={adminListStyles.summaryRow}>
      <Text style={adminListStyles.summaryText} numberOfLines={2}>
        {summaryText}
      </Text>
      {summaryRight}
      {loading ? (
        <ActivityIndicator size="small" color={adminTheme.accent} />
      ) : null}
    </View>
  </View>
)

export default AdminListFilters
