import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import {
  useDeleteAdminCategoryMutation,
  useGetAdminCategoryQuery,
  useUpdateAdminCategoryMutation,
} from '@/redux/features/adminCategorySlice';
import { Colors } from '@/constants/Colors';
import HeaderBar from '@/app/admin/components/HeaderBar';

const CategoryDetailScreen = () => {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const id = String(params.id);

  const { data, isLoading, isFetching, refetch } = useGetAdminCategoryQuery({ id });
  const [updateCategory, { isLoading: isSaving }] = useUpdateAdminCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteAdminCategoryMutation();

  const [name, setName] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    if (data?.category) {
      setName(data.category.name);
      setImage(data.category.image ?? '');
    }
  }, [data?.category]);

  const onSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Category name is required');
      return;
    }

    try {
      await updateCategory({
        id,
        body: {
          name: trimmed,
          image: image.trim() || null,
        },
      }).unwrap();
      Alert.alert('Saved', 'Category updated successfully');
      refetch();
    } catch (e: unknown) {
      const msg =
        (e as { data?: { error?: { message?: string } } })?.data?.error?.message ||
        'Failed to update category';
      Alert.alert('Error', msg);
    }
  };

  const onDelete = () => {
    Alert.alert(
      'Delete category',
      'This cannot be undone. Subcategories and linked products must be removed first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory({ id }).unwrap();
              Alert.alert('Deleted', 'Category removed');
              router.back();
            } catch (e: unknown) {
              const msg =
                (e as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                'Failed to delete category';
              Alert.alert('Error', msg);
            }
          },
        },
      ],
    );
  };

  if (isLoading || !data?.category) {
    return (
      <AdminScreen style={styles.container}>
        <HeaderBar title="Category" />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.light.darkGreen} />
        </View>
      </AdminScreen>
    );
  }

  const childCount = data.category.children?.length ?? 0;
  const breadcrumb = data.breadcrumb?.map((b) => b.name).join(' › ') ?? '';

  return (
    <AdminScreen style={styles.container}>
      <HeaderBar title="Edit category" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {breadcrumb ? <Text style={styles.breadcrumb}>{breadcrumb}</Text> : null}

        <View style={styles.summaryCard}>
          {image.trim() ? (
            <Image source={{ uri: image.trim() }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Ionicons name="folder-outline" size={28} color="#94A3B8" />
            </View>
          )}
          <Text style={styles.summaryMeta}>
            {childCount > 0
              ? `${childCount} subcategor${childCount === 1 ? 'y' : 'ies'}`
              : 'No subcategories'}
          </Text>
        </View>

        <Text style={styles.label}>Name</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} />

        <Text style={styles.label}>Image URL</Text>
        <TextInput
          value={image}
          onChangeText={setImage}
          placeholder="https://..."
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={styles.addChildBtn}
          onPress={() =>
            router.push({
              pathname: '/admin/categories/create',
              params: { parentId: id },
            })
          }
        >
          <Ionicons name="add-circle-outline" size={18} color={Colors.light.darkGreen} />
          <Text style={styles.addChildText}>Add subcategory</Text>
        </TouchableOpacity>

        {childCount > 0 ? (
          <View style={styles.childrenBox}>
            <Text style={styles.childrenTitle}>Subcategories</Text>
            {data.category.children.map((child) => (
              <TouchableOpacity
                key={child._id}
                style={styles.childRow}
                onPress={() => router.push(`/admin/categories/${child._id}`)}
              >
                <Text style={styles.childName}>{child.name}</Text>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.saveBtn, (isSaving || isFetching) && styles.saveBtnDisabled]}
          onPress={onSave}
          disabled={isSaving || isFetching}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteBtn, isDeleting && styles.saveBtnDisabled]}
          onPress={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color={Colors.light.gradientRed_1} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color={Colors.light.gradientRed_1} />
              <Text style={styles.deleteBtnText}>Delete category</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </AdminScreen>
  );
};

export default CategoryDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  breadcrumb: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryMeta: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
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
  addChildBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  addChildText: {
    color: Colors.light.darkGreen,
    fontWeight: '700',
    fontSize: 14,
  },
  childrenBox: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  childrenTitle: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    fontWeight: '800',
    color: '#111827',
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  childName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
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
  deleteBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: {
    color: Colors.light.gradientRed_1,
    fontWeight: '700',
    fontSize: 14,
  },
});
