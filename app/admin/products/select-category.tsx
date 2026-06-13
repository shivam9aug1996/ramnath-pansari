import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AdminScreen from '@/app/admin/components/AdminScreen';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useListAdminCategoriesQuery } from '@/redux/features/adminCategorySlice';
import { Category } from '@/types/global';
import { Colors } from '@/constants/Colors';
import HeaderBar from '@/app/admin/components/HeaderBar';
import useDebounce from '@/hooks/useDebounce';
import {
  buildCategoryStackToId,
  flattenCategories,
} from '../categories/utils';
import { setPendingCategorySelection } from './categorySelection';

const SelectCategoryScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    currentCategoryId?: string;
  }>();

  const currentCategoryId = params.currentCategoryId
    ? String(params.currentCategoryId)
    : undefined;

  const { data, isLoading } = useListAdminCategoriesQuery();
  const roots = data?.categories ?? [];

  const [stack, setStack] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (roots.length && currentCategoryId) {
      setStack(buildCategoryStackToId(roots, currentCategoryId));
    }
  }, [roots, currentCategoryId]);

  const isSearchMode = debouncedSearch.trim().length > 0;

  const currentItems = useMemo(() => {
    if (isSearchMode) return [];
    if (stack.length === 0) return roots;
    return stack[stack.length - 1].children ?? [];
  }, [isSearchMode, roots, stack]);

  const searchResults = useMemo(() => {
    if (!isSearchMode) return [];
    const q = debouncedSearch.trim().toLowerCase();
    return flattenCategories(roots).filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        (row.pathLabel?.toLowerCase().includes(q) ?? false),
    );
  }, [roots, debouncedSearch, isSearchMode]);

  const breadcrumb = useMemo(
    () => ['All categories', ...stack.map((c) => c.name)],
    [stack],
  );

  const onSelect = (categoryId: string, categoryLabel: string) => {
    setPendingCategorySelection({ id: categoryId, label: categoryLabel });
    router.back();
  };

  const onDrillDown = (category: Category) => {
    setSearch('');
    setStack((prev) => [...prev, category]);
  };

  const onBreadcrumbPress = (index: number) => {
    if (index === 0) {
      setStack([]);
      return;
    }
    setStack((prev) => prev.slice(0, index));
  };

  const renderCategoryRow = (
    item: Category,
    options?: { pathLabel?: string; forceSelect?: boolean },
  ) => {
    const childCount = item.children?.length ?? 0;
    const isLeaf = childCount === 0;
    const isSelected = currentCategoryId === item._id;
    const pathLabel = options?.pathLabel;
    const fullPath =
      pathLabel ?? [...stack.map((s) => s.name), item.name].join(' › ');

    return (
      <View style={[styles.row, isSelected && styles.rowSelected]}>
        <TouchableOpacity
          style={styles.rowMain}
          onPress={() => {
            if (options?.forceSelect || isLeaf) {
              onSelect(item._id, fullPath);
            } else {
              onDrillDown(item);
            }
          }}
          activeOpacity={0.7}
        >
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <Ionicons
                name={isLeaf ? 'pricetag-outline' : 'folder-outline'}
                size={18}
                color="#64748B"
              />
            </View>
          )}

          <View style={styles.rowBody}>
            <Text style={styles.rowName}>{item.name}</Text>
            <Text style={styles.rowMeta} numberOfLines={2}>
              {pathLabel
                ? pathLabel
                : isLeaf
                  ? 'Tap to select'
                  : `${childCount} subcategor${childCount === 1 ? 'y' : 'ies'} · tap to open`}
            </Text>
          </View>

          {isLeaf || options?.forceSelect ? (
            <Ionicons
              name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
              size={22}
              color={isSelected ? Colors.light.darkGreen : '#94A3B8'}
            />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          )}
        </TouchableOpacity>

        {!isLeaf && !options?.forceSelect ? (
          <TouchableOpacity
            style={styles.selectHereBtn}
            onPress={() => onSelect(item._id, fullPath)}
          >
            <Text style={styles.selectHereText}>Use this level</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <AdminScreen style={styles.container}>
      <HeaderBar title="Choose category" />

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#94A3B8" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search all categories…"
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 ? (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {!isSearchMode ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.breadcrumbScroll}
        >
          {breadcrumb.map((label, index) => {
            const isLast = index === breadcrumb.length - 1;
            return (
              <TouchableOpacity
                key={`${label}-${index}`}
                style={styles.breadcrumbItem}
                onPress={() => onBreadcrumbPress(index)}
                disabled={isLast}
              >
                <Text
                  style={[
                    styles.breadcrumbText,
                    isLast && styles.breadcrumbTextActive,
                  ]}
                >
                  {label}
                </Text>
                {!isLast ? (
                  <Ionicons name="chevron-forward" size={12} color="#94A3B8" />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      <Text style={styles.hint}>
        {isSearchMode
          ? 'Tap a result to select it'
          : stack.length === 0
            ? 'Pick a category, then subcategory if needed'
            : 'Open a subcategory or select at this level'}
      </Text>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.light.darkGreen} />
        </View>
      ) : (
        <FlatList
          data={isSearchMode ? searchResults : currentItems}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) =>
            isSearchMode
              ? renderCategoryRow(
                  {
                    _id: item._id,
                    name: item.name,
                    image: item.image,
                    children: [],
                  },
                  { pathLabel: item.pathLabel ?? item.name, forceSelect: true },
                )
              : renderCategoryRow(item as Category)
          }
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Text style={styles.emptyTitle}>
                {isSearchMode ? 'No categories found' : 'No subcategories here'}
              </Text>
            </View>
          }
        />
      )}
    </AdminScreen>
  );
};

export default SelectCategoryScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#fff',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  breadcrumbScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 4,
    alignItems: 'center',
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breadcrumbText: {
    fontSize: 12,
    color: Colors.light.darkGreen,
    fontWeight: '600',
  },
  breadcrumbTextActive: { color: '#64748B' },
  hint: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    fontSize: 12,
    color: '#64748B',
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  row: {
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  rowSelected: {
    borderColor: Colors.light.darkGreen,
    backgroundColor: '#F0FDF4',
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  rowMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
  },
  selectHereBtn: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  selectHereText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.darkGreen,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 200,
  },
  emptyTitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
});
