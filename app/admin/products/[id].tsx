import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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
import ProductFormList, {
  buildInitialFormValues,
  productToFormValues,
} from './components/ProductFormList';
import { findCategoryBreadcrumb } from '../categories/utils';
import { consumePendingCategorySelection } from './categorySelection';
import { confirmAction, showAlert } from '@/utils/platformAlert';

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
    return productToFormValues(p, { categoryLabel });
  }, [data?.product, categoriesData?.categories]);

  const [formValues, setFormValues] = useState(buildInitialFormValues());

  useEffect(() => {
    if (data?.product) {
      setFormValues(loadedValues);
    }
  }, [loadedValues, data?.product]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

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

  const offerUsage = data?.offerUsage;

  const onDelete = async (permanent: boolean) => {
    if (offerUsage && !offerUsage.canDelete) {
      showAlert(
        'Cannot delete',
        offerUsage.blockedEdits.find((b) => b.field === 'delete')?.reason ??
          'Disable live offers using this product first.',
      );
      return;
    }

    const confirmed = await confirmAction(
      permanent ? 'Delete permanently' : 'Delete product',
      permanent
        ? 'This removes the product from the database forever. Order history will still show past purchases. Continue?'
        : 'This will hide the product from the store. Continue?',
      permanent ? 'Delete forever' : 'Delete',
    );
    if (!confirmed) return;

    try {
      await deleteProduct({ id, permanent }).unwrap();
      showAlert(
        'Deleted',
        permanent ? 'Product permanently removed' : 'Product removed',
      );
      router.back();
    } catch (e: unknown) {
      const msg =
        (e as { data?: { error?: { message?: string } } })?.data?.error?.message ||
        'Failed to delete product';
      showAlert('Error', msg);
    }
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
      <HeaderBar
        title="Edit product"
        right={
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/admin/products/create',
                params: { cloneFrom: id },
              })
            }
            hitSlop={8}
            style={styles.cloneBtn}
            accessibilityLabel="Clone product"
          >
            <Ionicons name="copy-outline" size={20} color="#2563EB" />
          </TouchableOpacity>
        }
      />

      {data.product.jiomartUid || data.product.skuCode ? (
        <View style={styles.syncBanner}>
          <Text style={styles.syncText}>
            {data.product.jiomartUid ? `JioMart: ${data.product.jiomartUid}` : ''}
            {data.product.skuCode ? ` · SKU: ${data.product.skuCode}` : ''}
          </Text>
        </View>
      ) : null}

      {data.product.isDeleted ? (
        <View style={styles.deletedBanner}>
          <Text style={styles.deletedText}>
            This product is soft-deleted and hidden from the store.
          </Text>
        </View>
      ) : null}

      <ProductFormList
        values={formValues}
        onChange={setFormValues}
        submitLabel="Save changes"
        isSubmitting={isSaving}
        productFromJio={Boolean(data.product.productFromJio)}
        isDeleted={Boolean(data.product.isDeleted)}
        offerUsage={offerUsage}
        onOpenOffer={(offerId) => router.push(`/admin/offers/${offerId}`)}
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
            showAlert('Saved', 'Product updated successfully');
            refetch();
          } catch (e: unknown) {
            const msg =
              (e as { data?: { error?: { message?: string } } })?.data?.error?.message ||
              'Failed to update product';
            showAlert('Error', msg);
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
  deletedBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  deletedText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  cloneBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
