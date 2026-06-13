import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { adminTheme } from '@/app/admin/theme'

type Props = {
  currentPage: number
  totalPages?: number
  loading?: boolean
  onPrev: () => void
  onNext: () => void
}

const PaginationBar: React.FC<Props> = ({
  currentPage,
  totalPages = 1,
  loading,
  onPrev,
  onNext,
}) => {
  const atFirst = currentPage <= 1
  const atLast = currentPage >= totalPages

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <TouchableOpacity
          onPress={onPrev}
          disabled={atFirst || loading}
          style={[styles.navBtn, atFirst && styles.navBtnDisabled]}
          activeOpacity={0.85}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={atFirst ? adminTheme.textMuted : '#fff'}
          />
          <Text style={[styles.navText, atFirst && styles.navTextDisabled]}>
            Prev
          </Text>
        </TouchableOpacity>

        <View style={styles.indicatorWrap}>
          <Text style={styles.indicatorLabel}>Page</Text>
          <Text style={styles.indicatorValue}>
            {currentPage} / {totalPages}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onNext}
          disabled={atLast || loading}
          style={[styles.navBtn, atLast && styles.navBtnDisabled]}
          activeOpacity={0.85}
        >
          <Text style={[styles.navText, atLast && styles.navTextDisabled]}>
            Next
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={atLast ? adminTheme.textMuted : '#fff'}
          />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default PaginationBar

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminTheme.border,
    padding: 8,
    ...adminTheme.shadow,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: adminTheme.accent,
    minWidth: 88,
    justifyContent: 'center',
  },
  navBtnDisabled: {
    backgroundColor: '#F1F5F9',
  },
  navText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  navTextDisabled: {
    color: adminTheme.textMuted,
  },
  indicatorWrap: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  indicatorLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: adminTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  indicatorValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '800',
    color: adminTheme.textPrimary,
  },
})
