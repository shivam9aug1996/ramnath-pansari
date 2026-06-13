import { StyleSheet, ViewStyle } from 'react-native'
import { Colors } from '@/constants/Colors'

export const adminTheme = {
  screenBg: '#EEF2F6',
  cardBg: '#FFFFFF',
  border: '#E8EDF3',
  textPrimary: '#111827',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  accent: Colors.light.darkGreen,
  accentSoft: '#DCFCE7',
  shadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  } satisfies ViewStyle,
  cardRadius: 18,
  listHorizontalPad: 16,
}

export const adminListStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: adminTheme.screenBg,
  },
  filtersPanel: {
    marginHorizontal: adminTheme.listHorizontalPad,
    marginTop: 12,
    marginBottom: 8,
    padding: 14,
    backgroundColor: adminTheme.cardBg,
    borderRadius: adminTheme.cardRadius,
    borderWidth: 1,
    borderColor: adminTheme.border,
    gap: 12,
    ...adminTheme.shadow,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminTheme.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: '#F8FAFC',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: adminTheme.textPrimary,
  },
  pillRow: {
    gap: 8,
    paddingVertical: 2,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: adminTheme.border,
  },
  pillActive: {
    backgroundColor: adminTheme.accent,
    borderColor: adminTheme.accent,
  },
  pillText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryText: {
    flex: 1,
    fontSize: 12,
    color: adminTheme.textSecondary,
    fontWeight: '600',
  },
  summaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: adminTheme.accent,
  },
  summaryDivider: {
    color: '#CBD5E1',
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 4,
    paddingBottom: 28,
  },
  listCard: {
    marginHorizontal: adminTheme.listHorizontalPad,
    marginBottom: 10,
    backgroundColor: adminTheme.cardBg,
    borderRadius: adminTheme.cardRadius,
    borderWidth: 1,
    borderColor: adminTheme.border,
    ...adminTheme.shadow,
  },
})
