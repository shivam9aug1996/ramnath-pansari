import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import AdminScreen from '@/app/admin/components/AdminScreen';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCreateAdminProductMutation } from '@/redux/features/adminProductSlice';
import HeaderBar from '@/app/admin/components/HeaderBar';
import ProductFormList, { buildInitialFormValues } from './components/ProductFormList';
import { consumePendingCategorySelection } from './categorySelection';

const CreateProductScreen = () => {
  const router = useRouter();
  const [createProduct, { isLoading }] = useCreateAdminProductMutation();
  const [formValues, setFormValues] = useState(buildInitialFormValues());

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

  return (
    <AdminScreen style={styles.container}>
      <HeaderBar title="New product" />
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
            Alert.alert('Created', 'Product added successfully');
            router.back();
          } catch (e: unknown) {
            const msg =
              (e as { data?: { error?: { message?: string } } })?.data?.error?.message ||
              'Failed to create product';
            Alert.alert('Error', msg);
          }
        }}
      />
    </AdminScreen>
  );
};

export default CreateProductScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
});
