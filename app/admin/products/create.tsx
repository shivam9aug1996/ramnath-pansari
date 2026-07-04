import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import AdminScreen from '@/app/admin/components/AdminScreen';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  useCreateAdminProductMutation,
  useGetAdminProductQuery,
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
import { showAlert } from '@/utils/platformAlert';

const CreateProductScreen = () => {
  const router = useRouter();
  const { cloneFrom } = useLocalSearchParams<{ cloneFrom?: string }>();
  const cloneId = cloneFrom ? String(cloneFrom) : undefined;

  const [createProduct, { isLoading }] = useCreateAdminProductMutation();
  const { data: cloneSource, isLoading: isLoadingClone, isError: isCloneError } =
    useGetAdminProductQuery({ id: cloneId! }, { skip: !cloneId });
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useListAdminCategoriesQuery(undefined, {
      skip: !cloneId,
    });

  const [formValues, setFormValues] = useState(buildInitialFormValues());
  const [clonePrefilled, setClonePrefilled] = useState(false);

  useEffect(() => {
    if (!cloneId || !cloneSource?.product || clonePrefilled) return;

    const categoryId = cloneSource.product.categoryPath?.at(-1);
    if (categoryId && isLoadingCategories) return;

    const categoryLabel =
      categoryId && categoriesData?.categories
        ? findCategoryBreadcrumb(categoriesData.categories, categoryId)
        : undefined;

    setFormValues(
      productToFormValues(cloneSource.product, { categoryLabel, clone: true }),
    );
    setClonePrefilled(true);
  }, [
    cloneId,
    cloneSource?.product,
    categoriesData?.categories,
    clonePrefilled,
    isLoadingCategories,
  ]);

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

  const isCloneLoading =
    Boolean(cloneId) &&
    (isLoadingClone ||
      isLoadingCategories ||
      (Boolean(cloneSource?.product) && !clonePrefilled));
  const cloneSourceProduct = cloneSource?.product;
  const cloneLoadFailed =
    Boolean(cloneId) && !isLoadingClone && (isCloneError || !cloneSourceProduct);
  const showJioCloneNote =
    cloneSourceProduct?.productFromJio ||
    cloneSourceProduct?.jiomartUid ||
    cloneSourceProduct?.skuCode;

  if (cloneLoadFailed) {
    return (
      <AdminScreen style={styles.container}>
        <HeaderBar title="Clone product" />
        <View style={styles.centerState}>
          <Text style={styles.errorText}>Could not load product to clone.</Text>
        </View>
      </AdminScreen>
    );
  }

  if (isCloneLoading) {
    return (
      <AdminScreen style={styles.container}>
        <HeaderBar title="Clone product" />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.light.darkGreen} />
        </View>
      </AdminScreen>
    );
  }

  return (
    <AdminScreen style={styles.container}>
      <HeaderBar title={cloneId ? 'Clone product' : 'New product'} />

      {showJioCloneNote ? (
        <View style={styles.cloneBanner}>
          <Text style={styles.cloneBannerText}>
            JioMart link is not copied. This saves as a new manual product.
          </Text>
        </View>
      ) : null}

      <ProductFormList
        values={formValues}
        onChange={setFormValues}
        submitLabel="Create product"
        isSubmitting={isLoading}
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
            await createProduct(payload).unwrap();
            showAlert('Created', 'Product added successfully');
            router.back();
          } catch (e: unknown) {
            const msg =
              (e as { data?: { error?: { message?: string } } })?.data?.error?.message ||
              'Failed to create product';
            showAlert('Error', msg);
          }
        }}
      />
    </AdminScreen>
  );
};

export default CreateProductScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cloneBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  cloneBannerText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  errorText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
});
