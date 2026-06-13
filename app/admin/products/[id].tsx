import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import AdminScreen from '@/app/admin/components/AdminScreen';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  useDeleteAdminProductMutation,
  useGetAdminProductQuery,
  useUpdateAdminProductMutation,
} from '@/redux/features/adminProductSlice';
import { useListAdminCategoriesQuery } from '@/redux/features/adminCategorySlice';
import { Colors } from '@/constants/Colors';
import HeaderBar from '@/app/admin/components/HeaderBar';
import ProductFormList, { buildInitialFormValues } from './components/ProductFormList';
import { findCategoryBreadcrumb } from '../categories/utils';
import { consumePendingCategorySelection } from './categorySelection';

const ProductDetailScreen = () => {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const id = String(params.id);

  const { data, isLoading, refetch } = useGetAdminProductQuery({ id });
  const { data: categoriesData } = useListAdminCategoriesQuery();
  const [updateProduct, { isLoading: isSaving }] = useUpdateAdminProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteAdminProductMutation();

  const loadedValues = useMemo(() => {
    const p = data?.product;
    if (!p) return buildInitialFormValues();
    const categoryId = p.categoryPath?.at(-1);
    const categoryLabel =
      categoryId && categoriesData?.categories
        ? findCategoryBreadcrumb(categoriesData.categories, categoryId)
        : undefined;
    return buildInitialFormValues({
      name: p.name,
      size: p.size,
      price: String(p.price),
      discountedPrice: String(p.discountedPrice),
      image: p.image ?? '',
      brand: p.brand ?? '',
      category: p.category ?? '',
      maxQuantity: p.maxQuantity != null ? String(p.maxQuantity) : '',
      isOutOfStock: p.isOutOfStock,
      categoryId,
      categoryLabel: categoryLabel ?? undefined,
    });
  }, [data?.product, categoriesData?.categories]);

  const [formValues, setFormValues] = useState(buildInitialFormValues());

  useEffect(() => {
    if (data?.product) {
      setFormValues(loadedValues);
    }
  }, [loadedValues, data?.product]);

  useFocusEffect(
    useCallback(() => {
      const picked = consumePendingCategorySelection();
      if (picked) {
        setFormValues((prev) => ({
          ...prev,
          categoryId: picked.id,
          categoryLabel: picked.label,
        }));
      }
    }, []),
  );

  const onDelete = () => {
    Alert.alert(
      'Delete product',
      'This will hide the product from the store. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct({ id }).unwrap();
              Alert.alert('Deleted', 'Product removed');
              router.back();
            } catch (e: unknown) {
              const msg =
                (e as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                'Failed to delete product';
              Alert.alert('Error', msg);
            }
          },
        },
      ],
    );
  };

  if (isLoading || !data?.product) {
    return (
      <AdminScreen style={styles.container}>
        <HeaderBar title="Product" />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.light.darkGreen} />
        </View>
      </AdminScreen>
    );
  }

  return (
    <AdminScreen style={styles.container}>
      <HeaderBar title="Edit product" />

      {data.product.jiomartUid || data.product.skuCode ? (
        <View style={styles.syncBanner}>
          <Text style={styles.syncText}>
            {data.product.jiomartUid ? `JioMart: ${data.product.jiomartUid}` : ''}
            {data.product.skuCode ? ` · SKU: ${data.product.skuCode}` : ''}
          </Text>
        </View>
      ) : null}

      <ProductFormList
        values={formValues}
        onChange={setFormValues}
        submitLabel="Save changes"
        isSubmitting={isSaving}
        onDelete={onDelete}
        isDeleting={isDeleting}
        onPickCategory={() =>
          router.push({
            pathname: '/admin/products/select-category',
            params: {
              currentCategoryId: formValues.categoryId ?? '',
            },
          })
        }
        onSubmit={async (payload) => {
          try {
            await updateProduct({ id, body: payload }).unwrap();
            Alert.alert('Saved', 'Product updated successfully');
            refetch();
          } catch (e: unknown) {
            const msg =
              (e as { data?: { error?: { message?: string } } })?.data?.error?.message ||
              'Failed to update product';
            Alert.alert('Error', msg);
          }
        }}
      />
    </AdminScreen>
  );
};

export default ProductDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  syncBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  syncText: { fontSize: 11, color: '#475569', fontWeight: '600' },
});
