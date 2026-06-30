import React from 'react';
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
import { AdminProductDocument, AdminProductInput, ProductOfferUsage } from '@/types/global';
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
  promoOnly: boolean;
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
    promoOnly: partial?.promoOnly ?? false,
    categoryId: partial?.categoryId,
    categoryLabel: partial?.categoryLabel,
  };
}

export function productToFormValues(
  product: AdminProductDocument,
  options?: { categoryLabel?: string; clone?: boolean },
): ProductFormValues {
  const categoryId = product.categoryPath?.at(-1);
  const name = options?.clone ? `${product.name} (Copy)` : product.name;
  return buildInitialFormValues({
    name,
    size: product.size,
    price: String(product.price),
    discountedPrice: String(product.discountedPrice),
    image: product.image ?? '',
    brand: product.brand ?? '',
    category: product.category ?? '',
    maxQuantity: product.maxQuantity != null ? String(product.maxQuantity) : '',
    isOutOfStock: product.isOutOfStock,
    promoOnly: product.promoOnly ?? false,
    categoryId,
    categoryLabel: options?.categoryLabel,
  });
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
    promoOnly: values.promoOnly,
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
  productFromJio?: boolean;
  offerUsage?: ProductOfferUsage;
  onOpenOffer?: (offerId: string) => void;
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
  productFromJio = false,
  offerUsage,
  onOpenOffer,
}: Props) {
  const promoOnlyLocked = offerUsage?.blockedFields.includes('promoOnly') ?? false;
  const deleteBlocked = offerUsage?.blockedFields.includes('delete') ?? false;

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
      {offerUsage?.inLiveOffer ? (
        <View style={styles.offerBanner}>
          <View style={styles.offerBannerHeader}>
            <Ionicons name="gift-outline" size={20} color="#BE185D" />
            <Text style={styles.offerBannerTitle}>Used in live offer</Text>
          </View>
          {offerUsage.liveOffers.map((offer) => (
            <TouchableOpacity
              key={offer.offerId}
              style={styles.offerRow}
              onPress={() => onOpenOffer?.(offer.offerId)}
              disabled={!onOpenOffer}
              activeOpacity={onOpenOffer ? 0.7 : 1}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.offerRowTitle}>
                  Min ₹{offer.minOrderValue} · gift at ₹{offer.promoPrice}
                </Text>
                <Text style={styles.offerRowHint}>
                  {onOpenOffer ? 'Tap to open offer' : `Offer ${offer.offerId.slice(0, 8)}…`}
                </Text>
              </View>
              {onOpenOffer ? (
                <Ionicons name="chevron-forward" size={16} color="#BE185D" />
              ) : null}
            </TouchableOpacity>
          ))}

          <Text style={styles.offerSectionLabel}>Safe to edit</Text>
          {offerUsage.safeToEdit.map((line) => (
            <View key={line} style={styles.offerBulletRow}>
              <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
              <Text style={styles.offerBulletText}>{line}</Text>
            </View>
          ))}

          <Text style={[styles.offerSectionLabel, { marginTop: 10 }]}>Blocked while offer is live</Text>
          {offerUsage.blockedEdits.map((item) => (
            <View key={item.field} style={styles.offerBulletRow}>
              <Ionicons name="close-circle" size={14} color="#DC2626" />
              <Text style={styles.offerBulletText}>{item.reason}</Text>
            </View>
          ))}

          {offerUsage.notes.map((note) => (
            <Text key={note} style={styles.offerNote}>
              {note}
            </Text>
          ))}
        </View>
      ) : null}

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
          {offerUsage?.inLiveOffer ? (
            <Text style={styles.hint}>Does not change offer promo price</Text>
          ) : null}
        </View>
      </View>
      <Text style={styles.hint}>
        Promo products are hidden from customer browse and can only appear via offers
      </Text>

      <View style={styles.switchRow}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={styles.switchLabel}>Promo / freebie product only</Text>
          <Text style={styles.hint}>Not listed for normal shopping</Text>
        </View>
        <Switch
          value={values.promoOnly}
          onValueChange={(promoOnly) => {
            if (promoOnlyLocked && !promoOnly) {
              Alert.alert(
                'Blocked',
                offerUsage?.blockedEdits.find((b) => b.field === 'promoOnly')?.reason ??
                  'Disable live offers using this product first.',
              );
              return;
            }
            setField('promoOnly', promoOnly);
          }}
          disabled={promoOnlyLocked && values.promoOnly}
          trackColor={{ true: Colors.light.darkGreen }}
        />
      </View>
      {promoOnlyLocked ? (
        <Text style={styles.hint}>
          Promo / freebie stays on while a live offer uses this product
        </Text>
      ) : null}

      {productFromJio ? (
        <View style={styles.jioBadge}>
          <Text style={styles.jioBadgeText}>Synced from JioMart</Text>
        </View>
      ) : null}

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
          style={[
            styles.deleteBtn,
            (isDeleting || deleteBlocked) && styles.saveBtnDisabled,
          ]}
          onPress={() => {
            if (deleteBlocked) {
              Alert.alert(
                'Cannot delete',
                offerUsage?.blockedEdits.find((b) => b.field === 'delete')?.reason ??
                  'Disable live offers using this product first.',
              );
              return;
            }
            onDelete();
          }}
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
  jioBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  jioBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  offerBanner: {
    marginBottom: 4,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  offerBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  offerBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#BE185D',
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#FECDD3',
  },
  offerRowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#881337',
  },
  offerRowHint: {
    marginTop: 2,
    fontSize: 11,
    color: '#BE185D',
  },
  offerSectionLabel: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '800',
    color: '#9F1239',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  offerBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 6,
  },
  offerBulletText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#881337',
  },
  offerNote: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 16,
    color: '#9F1239',
    fontStyle: 'italic',
  },
});
