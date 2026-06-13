import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AdminScreen from '@/app/admin/components/AdminScreen';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useCreateAdminCategoryMutation,
  useListAdminCategoriesQuery,
} from '@/redux/features/adminCategorySlice';
import { Colors } from '@/constants/Colors';
import HeaderBar from '@/app/admin/components/HeaderBar';
import useDebounce from '@/hooks/useDebounce';
import { flattenCategories } from './utils';

type ParentOption = {
  _id: string | undefined;
  name: string;
  pathLabel: string;
};

const CreateCategoryScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ parentId?: string }>();
  const { data } = useListAdminCategoriesQuery();
  const [createCategory, { isLoading }] = useCreateAdminCategoryMutation();

  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [parentSearch, setParentSearch] = useState('');
  const debouncedParentSearch = useDebounce(parentSearch, 300);
  const [parentId, setParentId] = useState<string | undefined>(
    params.parentId ? String(params.parentId) : undefined,
  );

  const parentOptions = useMemo(() => {
    const rows = flattenCategories(data?.categories ?? []);
    const rootOption: ParentOption = {
      _id: undefined,
      name: 'None (top-level)',
      pathLabel: '',
    };
    const all: ParentOption[] = [
      rootOption,
      ...rows.map((row) => ({
        _id: row._id,
        name: row.name,
        pathLabel: row.pathLabel ?? row.name,
      })),
    ];

    const q = debouncedParentSearch.trim().toLowerCase();
    if (!q) return all;

    return all.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        opt.pathLabel.toLowerCase().includes(q),
    );
  }, [data?.categories, debouncedParentSearch]);

  const onSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Category name is required');
      return;
    }

    try {
      await createCategory({
        name: trimmed,
        image: image.trim() || null,
        parentCategoryId: parentId,
      }).unwrap();
      Alert.alert('Created', 'Category added successfully');
      router.back();
    } catch (e: unknown) {
      const msg =
        (e as { data?: { error?: { message?: string } } })?.data?.error?.message ||
        'Failed to create category';
      Alert.alert('Error', msg);
    }
  };

  const renderParentOption = ({ item: option }: { item: ParentOption }) => {
    const active = option._id === parentId || (!option._id && !parentId);
    return (
      <TouchableOpacity
        style={[styles.parentOption, active && styles.parentOptionActive]}
        onPress={() => setParentId(option._id)}
      >
        <Text
          style={[styles.parentOptionText, active && styles.parentOptionTextActive]}
          numberOfLines={1}
        >
          {option.name}
        </Text>
        {option.pathLabel && option._id ? (
          <Text style={styles.parentPath} numberOfLines={1}>
            {option.pathLabel}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  const listHeader = (
    <View>
      <Text style={styles.label}>Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Staples, Dairy, Snacks"
        style={styles.input}
        autoFocus
      />

      <Text style={styles.label}>Image URL (optional)</Text>
      <TextInput
        value={image}
        onChangeText={setImage}
        placeholder="https://..."
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {image.trim() ? (
        <Image source={{ uri: image.trim() }} style={styles.preview} />
      ) : null}

      <Text style={styles.label}>Parent category</Text>
      <View style={styles.parentSearchWrap}>
        <Ionicons name="search" size={16} color="#94A3B8" />
        <TextInput
          value={parentSearch}
          onChangeText={setParentSearch}
          placeholder="Search parent…"
          placeholderTextColor="#94A3B8"
          style={styles.parentSearchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );

  const listFooter = (
    <TouchableOpacity
      style={[styles.saveBtn, isLoading && styles.saveBtnDisabled]}
      onPress={onSubmit}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.saveBtnText}>Create category</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <AdminScreen style={styles.container}>
      <HeaderBar title="New category" />

      <FlatList
        data={parentOptions}
        keyExtractor={(item) => item._id ?? 'root'}
        renderItem={renderParentOption}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.parentEmpty}>No parent matches your search</Text>
        }
      />
    </AdminScreen>
  );
};

export default CreateCategoryScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#111827',
  },
  preview: {
    marginTop: 10,
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  parentSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
  },
  parentSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  parentOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
  },
  parentOptionActive: {
    backgroundColor: '#F0FDF4',
  },
  parentOptionText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  parentOptionTextActive: {
    color: Colors.light.darkGreen,
  },
  parentPath: {
    marginTop: 2,
    fontSize: 11,
    color: '#94A3B8',
  },
  parentEmpty: {
    padding: 16,
    textAlign: 'center',
    color: '#64748B',
    fontSize: 13,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
  },
  saveBtn: {
    marginTop: 24,
    backgroundColor: Colors.light.darkGreen,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
