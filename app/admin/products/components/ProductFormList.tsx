import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AdminProductInput } from '@/types/global';
import { Colors } from '@/constants/Colors';

export type ProductFormValues = {
  name: string;
  size: string;
  price: string;
  discountedPrice: string;
  image: string;
  brand: string;
  category: string;
  maxQuantity: string;
  isOutOfStock: boolean;
  categoryId?: string;
  categoryLabel?: string;
};

export function buildInitialFormValues(
  partial?: Partial<ProductFormValues>,
): ProductFormValues {
  return {
    name: partial?.name ?? '',
    size: partial?.size ?? '',
    price: partial?.price ?? '',
    discountedPrice: partial?.discountedPrice ?? '',
    image: partial?.image ?? '',
    brand: partial?.brand ?? '',
    category: partial?.category ?? '',
    maxQuantity: partial?.maxQuantity ?? '',
    isOutOfStock: partial?.isOutOfStock ?? false,
    categoryId: partial?.categoryId,
    categoryLabel: partial?.categoryLabel,
  };
}

export function formValuesToPayload(values: ProductFormValues): AdminProductInput | null {
  const name = values.name.trim();
  const size = values.size.trim();
  const price = parseFloat(values.price);
  const discountedPrice = parseFloat(values.discountedPrice);

  if (!name || !size || !values.categoryId) return null;
  if (!Number.isFinite(price) || !Number.isFinite(discountedPrice)) return null;

  return {
    name,
    size,
    price,
    discountedPrice,
    categoryPath: [values.categoryId],
    image: values.image.trim() || null,
    brand: values.brand.trim() || undefined,
    category: values.category.trim() || undefined,
    maxQuantity: values.maxQuantity ? Number(values.maxQuantity) : undefined,
    isOutOfStock: values.isOutOfStock,
  };
}

type Props = {
  values: ProductFormValues;
  onChange: (values: ProductFormValues) => void;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (payload: AdminProductInput) => Promise<void>;
  onPickCategory: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
};

export default function ProductFormList({
  values,
  onChange,
  submitLabel,
  isSubmitting,
  onSubmit,
  onPickCategory,
  onDelete,
  isDeleting = false,
}: Props) {
  const setField = <K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) => {
    onChange({ ...values, [key]: value });
  };

  const handleSubmit = async () => {
    const payload = formValuesToPayload(values);
    if (!payload) {
      Alert.alert('Validation', 'Fill name, size, prices, and choose a store category');
      return;
    }
    await onSubmit(payload);
  };

  return (
    <ScrollView
      style={styles.list}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Store category</Text>
      <TouchableOpacity style={styles.categoryCard} onPress={onPickCategory} activeOpacity={0.7}>
        <View style={styles.categoryCardIcon}>
          <Ionicons name="folder-open-outline" size={22} color={Colors.light.darkGreen} />
        </View>
        <View style={styles.categoryCardBody}>
          {values.categoryId ? (
            <>
              <Text style={styles.categoryCardTitle} numberOfLines={2}>
                {values.categoryLabel ?? 'Category selected'}
              </Text>
              <Text style={styles.categoryCardHint}>Tap to change</Text>
            </>
          ) : (
            <>
              <Text style={styles.categoryCardTitle}>Choose category</Text>
              <Text style={styles.categoryCardHint}>
                Pick category → subcategory step by step
              </Text>
            </>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      </TouchableOpacity>

      <Text style={styles.label}>Name</Text>
      <TextInput
        value={values.name}
        onChangeText={(name) => setField('name', name)}
        style={styles.input}
        placeholder="Product name"
      />

      <Text style={styles.label}>Size / quantity label</Text>
      <TextInput
        value={values.size}
        onChangeText={(size) => setField('size', size)}
        style={styles.input}
        placeholder="e.g. 1 kg, 500 g"
      />

      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>MRP (₹)</Text>
          <TextInput
            value={values.price}
            onChangeText={(price) => setField('price', price)}
            style={styles.input}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Selling price (₹)</Text>
          <TextInput
            value={values.discountedPrice}
            onChangeText={(discountedPrice) => setField('discountedPrice', discountedPrice)}
            style={styles.input}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
      <Text style={styles.hint}>Set selling price to 0 to hide from customer listings</Text>

      <Text style={styles.label}>Image URL</Text>
      <TextInput
        value={values.image}
        onChangeText={(image) => setField('image', image)}
        style={styles.input}
        autoCapitalize="none"
        placeholder="https://..."
      />
      {values.image.trim() ? (
        <Image source={{ uri: values.image.trim() }} style={styles.preview} />
      ) : null}

      <Text style={styles.label}>Brand (optional)</Text>
      <TextInput
        value={values.brand}
        onChangeText={(brand) => setField('brand', brand)}
        style={styles.input}
      />

      <Text style={styles.label}>Category label (optional)</Text>
      <TextInput
        value={values.category}
        onChangeText={(category) => setField('category', category)}
        style={styles.input}
        placeholder="e.g. Sugar, Rice"
      />

      <Text style={styles.label}>Max quantity per order (optional)</Text>
      <TextInput
        value={values.maxQuantity}
        onChangeText={(maxQuantity) => setField('maxQuantity', maxQuantity)}
        style={styles.input}
        keyboardType="number-pad"
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Out of stock</Text>
        <Switch
          value={values.isOutOfStock}
          onValueChange={(isOutOfStock) => setField('isOutOfStock', isOutOfStock)}
          trackColor={{ true: Colors.light.darkGreen }}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>{submitLabel}</Text>
        )}
      </TouchableOpacity>

      {onDelete ? (
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
              <Text style={styles.deleteText}>Delete product</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 12,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardBody: { flex: 1 },
  categoryCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  categoryCardHint: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
  },
  hint: {
    marginTop: 4,
    fontSize: 11,
    color: '#94A3B8',
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
  row2: { flexDirection: 'row', gap: 10 },
  preview: {
    marginTop: 10,
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  switchRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: '#334155' },
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
  deleteText: { color: Colors.light.gradientRed_1, fontWeight: '700' },
});
