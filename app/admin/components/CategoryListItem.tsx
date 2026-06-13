import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { FlatCategoryRow } from '../categories/utils'
import { adminListStyles, adminTheme } from '@/app/admin/theme'

const CategoryListItem = ({
  item,
  isSearchMode,
  onPress,
  onToggleExpand,
}: {
  item: FlatCategoryRow
  isSearchMode?: boolean
  onPress: (id: string) => void
  onToggleExpand?: (id: string) => void
}) => {
  const hasChildren = item.childCount > 0
  const showExpand = hasChildren && !isSearchMode

  return (
    <View style={[styles.rowWrap, { marginLeft: 16 + item.depth * 12 }]}>
      {showExpand ? (
        <TouchableOpacity
          style={styles.expandBtn}
          onPress={() => onToggleExpand?.(item._id)}
          hitSlop={8}
          accessibilityLabel={item.isExpanded ? 'Collapse' : 'Expand'}
          activeOpacity={0.75}
        >
          <Ionicons
            name={item.isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={16}
            color={adminTheme.accent}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.expandSpacer} />
      )}

      <TouchableOpacity
        style={[adminListStyles.listCard, styles.card, { marginHorizontal: 0, marginRight: 16 }]}
        onPress={() => onPress(item._id)}
        activeOpacity={0.75}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="folder-outline" size={20} color="#D97706" />
          </View>
        )}

        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {isSearchMode && item.pathLabel
              ? item.pathLabel
              : hasChildren
                ? `${item.childCount} subcategor${item.childCount === 1 ? 'y' : 'ies'}`
                : item.depth === 0
                  ? 'Top-level category'
                  : 'Leaf category'}
          </Text>
        </View>

        <View style={styles.editIcon}>
          <Ionicons name="create-outline" size={16} color={adminTheme.accent} />
        </View>
      </TouchableOpacity>
    </View>
  )
}

export default CategoryListItem

const styles = StyleSheet.create({
  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  expandBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: adminTheme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandSpacer: {
    width: 30,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: adminTheme.border,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
  },
  body: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: adminTheme.textPrimary,
  },
  meta: {
    marginTop: 3,
    fontSize: 12,
    color: adminTheme.textSecondary,
    fontWeight: '500',
  },
  editIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: adminTheme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
