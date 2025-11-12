import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { showToast } from '@/utils/utils';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGetOrderQuery, useUpdateOrderMutation } from '@/redux/features/adminOrderSlice';
import { ORDER_STATUS_VALUES, ORDER_STATUS_COLORS } from '@/constants/Order';
import HeaderBar from '@/app/admin/components/HeaderBar';
import DetailSection from './components/DetailSection';
import Field from './components/Field';
import { AdminOrderDocument } from '@/types/global';

// Field moved to component

const OrderDetailScreen = () => {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isFetching, isLoading, refetch } = useGetOrderQuery({ id: String(params.id) });
  const [updateOrder, { isLoading: isSaving }] = useUpdateOrderMutation();

  const [draft, setDraft] = React.useState<AdminOrderDocument | null>(null);

  React.useEffect(() => {
    if (data) setDraft(JSON.parse(JSON.stringify(data)));
  }, [data]);

  const onChange = (path: string[], value: any) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next: any = JSON.parse(JSON.stringify(prev));

      const isIndex = (k: any) => {
        const n = Number(k);
        return Number.isInteger(n) && String(n) === String(k);
      };

      let cursor: any = next;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        const nextKey = path[i + 1];

        if (Array.isArray(cursor)) {
          const idx = Number(key);
          if (!Number.isInteger(idx)) break;
          if (cursor[idx] == null || typeof cursor[idx] !== 'object') cursor[idx] = {};
          cursor = cursor[idx];
          continue;
        }

        // Ensure correct container type for the next segment
        if (isIndex(nextKey)) {
          // Next is an array index; keep this key as an array
          if (!Array.isArray(cursor[key])) cursor[key] = Array.isArray(cursor[key]) ? [...cursor[key]] : [];
        } else {
          cursor[key] = { ...(cursor[key] ?? {}) };
        }
        cursor = cursor[key];
      }

      const lastKey = path[path.length - 1];
      if (Array.isArray(cursor) && isIndex(lastKey)) {
        const idx = Number(lastKey);
        cursor[idx] = value;
      } else {
        cursor[lastKey] = value;
      }

      return recalcOrderDerived(next);
    });
  };

  const recalcOrderDerived = (order: AdminOrderDocument): AdminOrderDocument => {
    try {
      const items: any[] = (order as any)?.cartData?.cart?.items || [];
      const productCount = items.length;
      const totalProductCount = items.reduce((sum, it) => sum + (Number(it?.quantity) || 0), 0);
      const totalAmount = items.reduce((sum, it) => {
        const qty = Number(it?.quantity) || 0;
        const price = Number(it?.productDetails?.discountedPrice) || 0;
        return sum + price * qty;
      }, 0);

      (order as any).productCount = productCount;
      (order as any).totalProductCount = totalProductCount;
      (order as any).transactionData = {
        ...(order as any).transactionData,
        amount: totalAmount.toFixed(2),
      };
      (order as any).amountPaid = totalAmount.toFixed(2);
    } catch (e) {}
    return order;
  };

  const onRemoveItem = (index: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next: any = JSON.parse(JSON.stringify(prev));
      const items: any[] = next?.cartData?.cart?.items || [];
      if (index >= 0 && index < items.length) {
        items.splice(index, 1);
      }
      next.cartData.cart.items = items;
      return recalcOrderDerived(next);
    });
  };

  const onSave = async () => {
    try {
      if (!draft) return;
      // Validation: orderHistory must have at least one entry
      if (!Array.isArray((draft as any).orderHistory) || (draft as any).orderHistory.length === 0) {
        showToast({ type: 'error', text2: 'Please add at least one entry in orderHistory before saving.' });
        return;
      }
      // If status changed, append to orderHistory with server-friendly timestamp
      const body: any = JSON.parse(JSON.stringify(draft));
      if (data?.orderStatus !== draft.orderStatus) {
        const history = Array.isArray(body.orderHistory) ? body.orderHistory : [];
        const first = history[0];
        if (!first || String(first.status) !== String(draft.orderStatus)) {
          history.unshift({ status: draft.orderStatus, timestamp: new Date().toISOString() });
        }
        body.orderHistory = history;
      }
      const res = await updateOrder({ id: draft._id, body }).unwrap();
      Alert.alert('Saved', 'Order updated successfully');
      refetch();
    } catch (e: any) {
      Alert.alert('Error', e?.data?.error?.message || 'Failed to update order');
    }
  };

  const onChangeHistory = (index: number, key: 'status' | 'timestamp', value: any) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next: any = JSON.parse(JSON.stringify(prev));
      const list: any[] = Array.isArray(next.orderHistory) ? next.orderHistory : [];
      if (!list[index]) list[index] = {};
      list[index][key] = value;
      next.orderHistory = list;
      // Sync orderStatus to the last history entry's status
      const lastStatus = list.length ? String(list[0]?.status || '') : '';
      if (lastStatus) next.orderStatus = lastStatus;
      return next;
    });
  };

  const onDeleteHistory = (index: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next: any = JSON.parse(JSON.stringify(prev));
      const list: any[] = Array.isArray(next.orderHistory) ? next.orderHistory : [];
      if (index >= 0 && index < list.length) list.splice(index, 1);
      next.orderHistory = list;
      const lastStatus = list.length ? String(list[0]?.status || '') : '';
      if (lastStatus) next.orderStatus = lastStatus; else next.orderStatus = next.orderStatus; // keep as is if none
      return next;
    });
  };

  const onAddHistory = () => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next: any = JSON.parse(JSON.stringify(prev));
      const list: any[] = Array.isArray(next.orderHistory) ? next.orderHistory : [];
      list.unshift({ status: next.orderStatus || 'confirmed', timestamp: new Date().toISOString() });
      next.orderHistory = list;
      const lastStatus = list.length ? String(list[0]?.status || '') : '';
      if (lastStatus) next.orderStatus = lastStatus;
      return next;
    });
  };

  if (isLoading || !draft) {
    return (
      <SafeAreaView style={styles.container}> 
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 8 }}>Loading order…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {isFetching && (
         <View style={styles.loadingOverlay} pointerEvents="auto">
         <ActivityIndicator size="large" />
         <Text style={styles.loadingText}>Loading order…</Text>
       </View>
      )}
      <HeaderBar title={`Order Detail`} />
      <ScrollView
      contentContainerStyle={{ padding: 12, flexGrow: 1 }}
       
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={() => {
            console.log('Refreshing...');
            refetch();
          }}
        />
      }
      
      >
        <Text style={styles.title}>Order {draft.orderId}</Text>
        <Text style={styles.subtitle}>User: {draft.userId}</Text>

        {/* Order Status */}
        <DetailSection title="Order Status">
          <Text style={styles.label}>Current <Text style={styles.keyPath}> (orderStatus)</Text></Text>
          <View style={styles.statusPillsRow}>
            {ORDER_STATUS_VALUES.map((s) => {
              const active = String(draft.orderStatus) === s;
              return (
                <TouchableOpacity key={s} onPress={() => setDraft((prev) => prev ? { ...prev, orderStatus: s as any } : prev)} style={[styles.statusPill, active && styles.statusPillActive]}>
                  <Text style={[styles.statusPillText, active && styles.statusPillTextActive]}>{s.replaceAll('_',' ')}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </DetailSection>

        {/* Order History */}
        <DetailSection title="Order History">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View />
            <TouchableOpacity onPress={onAddHistory} style={styles.addBtn}><Text style={styles.addText}>Add</Text></TouchableOpacity>
          </View>
          {(Array.isArray((draft as any).orderHistory) ? (draft as any).orderHistory : []).map((h: any, i: number) => {
            const isLatest = i === 0; // newest at top
            const statusStr = String(h?.status || '') as keyof typeof ORDER_STATUS_COLORS;
            const color = ORDER_STATUS_COLORS[statusStr] || '#222';
            const ts = h?.timestamp ? new Date(h.timestamp) : null;
            const dateStr = ts ? ts.toLocaleDateString() : '';
            const timeStr = ts ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            return (
              <View key={`hist-${i}`} style={[styles.historyRow, isLatest && styles.historyRowLatest]}>
                <View style={styles.historyHeader}>
                  <View style={[styles.statusDot, { backgroundColor: color }]} />
                  <Text style={styles.historyStatusText}>{String(h?.status || '').replaceAll('_',' ')}</Text>
                  {isLatest ? <Text style={styles.latestBadge}>Latest</Text> : null}
                </View>
                <Text style={styles.historyTimestamp}>{dateStr} · {timeStr}</Text>

                <View style={styles.statusPillsRow}>
                  {ORDER_STATUS_VALUES.map((s) => {
                    const active = String(h?.status) === s;
                    return (
                      <TouchableOpacity key={`${i}-${s}`} onPress={() => onChangeHistory(i, 'status', s)} style={[styles.statusPill, active && styles.statusPillActive]}>
                        <Text style={[styles.statusPillText, active && styles.statusPillTextActive]}>{s.replaceAll('_',' ')}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.meta}>Timestamp <Text style={styles.keyPathInline}> (orderHistory[{i}].timestamp)</Text></Text>
                <TextInput value={String(h?.timestamp ?? '')} onChangeText={(t) => onChangeHistory(i, 'timestamp', t)} style={styles.input} />

                <TouchableOpacity onPress={() => onDeleteHistory(i)} style={[styles.removeBtn, { alignSelf: 'flex-start', position: 'relative', right: 0, top: 0 }]}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </DetailSection>

        {/* Transaction Data */}
        <DetailSection title="Transaction">
          <Field label="Method" path="transactionData.method">
            <TextInput value={String(draft.transactionData?.method ?? '')} onChangeText={(t) => onChange(['transactionData','method'], t)} style={styles.input} />
          </Field>
          <Field label="Amount (₹)" path="transactionData.amount">
            <TextInput keyboardType="numeric" value={String(draft.transactionData?.amount ?? '')} onChangeText={(t) => onChange(['transactionData','amount'], t)} style={styles.input} />
          </Field>
          <Field label="Currency" path="transactionData.currency">
            <TextInput value={String(draft.transactionData?.currency ?? '')} onChangeText={(t) => onChange(['transactionData','currency'], t)} style={styles.input} />
          </Field>
        </DetailSection>

        {/* Address Data */}
        <DetailSection title="Address">
          <Field label="Name" path="addressData.name">
            <TextInput value={String(draft.addressData?.name ?? '')} onChangeText={(t) => onChange(['addressData','name'], t)} style={styles.input} />
          </Field>
          <Field label="Phone" path="addressData.phone">
            <TextInput keyboardType="phone-pad" value={String(draft.addressData?.phone ?? '')} onChangeText={(t) => onChange(['addressData','phone'], t)} style={styles.input} />
          </Field>
          <Field label="Address" path="addressData.address">
            <TextInput multiline value={String(draft.addressData?.address ?? '')} onChangeText={(t) => onChange(['addressData','address'], t)} style={[styles.input, { height: 80 }]} />
          </Field>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Field label="Latitude" path="addressData.latitude">
                <TextInput keyboardType="numeric" value={String(draft.addressData?.latitude ?? '')} onChangeText={(t) => onChange(['addressData','latitude'], Number(t))} style={styles.input} />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Longitude" path="addressData.longitude">
                <TextInput keyboardType="numeric" value={String(draft.addressData?.longitude ?? '')} onChangeText={(t) => onChange(['addressData','longitude'], Number(t))} style={styles.input} />
              </Field>
            </View>
          </View>
        </DetailSection>

        {/* Cart Data (editable quantities and prices) */}
        <View style={styles.card}>
          <Text style={styles.section}>Cart</Text>
          {(Array.isArray((draft as any)?.cartData?.cart?.items) ? (draft as any).cartData.cart.items : []).map((it: any, idx: number) => {
            const dPrice = Number(it.productDetails?.discountedPrice ?? 0);
            const qty = Number(it.quantity ?? 0);
            const lineTotal = (isNaN(dPrice) ? 0 : dPrice) * (isNaN(qty) ? 0 : qty);
            return (
              <View key={`${it.productId}-${idx}`} style={styles.cartItemCard}>
                <View style={styles.headerRow}>
                  {it.productDetails?.image ? (
                    <Image source={{ uri: String(it.productDetails.image) }} style={styles.thumb} />
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{it.productDetails?.name}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.discountedPrice}>₹{it.productDetails?.discountedPrice}</Text>
                      {typeof it.productDetails?.price === 'number' && it.productDetails?.price > (it.productDetails?.discountedPrice ?? 0) ? (
                        <Text style={styles.originalPrice}>₹{it.productDetails?.price}</Text>
                      ) : null}
                      {it.productDetails?.size ? (
                        <Text style={styles.sizeText}> · {it.productDetails?.size}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.lineTotal}>Line Total: ₹{lineTotal.toFixed(2)}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => onRemoveItem(idx)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>

                <View style={styles.inputsRow}>
                  <View style={styles.inputCol}>
                    <Text style={styles.meta}>Qty <Text style={styles.keyPathInline}> (cartData.cart.items[{idx}].quantity)</Text></Text>
                    <TextInput
                      keyboardType="number-pad"
                      value={String(it.quantity)}
                      onChangeText={(t) => {
                        const n = Math.max(0, parseInt(t || '0', 10));
                        onChange(['cartData','cart','items', String(idx), 'quantity'] as any, isNaN(n) ? 0 : n);
                      }}
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.inputCol}>
                    <Text style={styles.meta}>Disc. Price <Text style={styles.keyPathInline}> (cartData.cart.items[{idx}].productDetails.discountedPrice)</Text></Text>
                    <TextInput
                      keyboardType="decimal-pad"
                      value={String(it.productDetails?.discountedPrice ?? '')}
                      onChangeText={(t) => {
                        const val = parseFloat(t || '0');
                        onChange(['cartData','cart','items', String(idx), 'productDetails', 'discountedPrice'] as any, isNaN(val) ? 0 : val);
                      }}
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.inputCol}>
                    <Text style={styles.meta}>Price <Text style={styles.keyPathInline}> (cartData.cart.items[{idx}].productDetails.price)</Text></Text>
                    <TextInput
                      keyboardType="decimal-pad"
                      value={String(it.productDetails?.price ?? '')}
                      onChangeText={(t) => {
                        const val = parseFloat(t || '0');
                        onChange(['cartData','cart','items', String(idx), 'productDetails', 'price'] as any, isNaN(val) ? 0 : val);
                      }}
                      style={styles.input}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 16 }} />

        {/* Computed totals (read-only) */}
        <View style={styles.card}>
          <Text style={styles.section}>Computed Totals</Text>
          <Field label="Product Count" path="productCount">
            <Text style={styles.valueText}>{Number((draft as any)?.productCount ?? 0)}</Text>
          </Field>
          <Field label="Total Product Count" path="totalProductCount">
            <Text style={styles.valueText}>{Number((draft as any)?.totalProductCount ?? 0)}</Text>
          </Field>
        </View>

        <TouchableOpacity style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} onPress={onSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Changes</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrderDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { paddingVertical: 6, paddingRight: 8, paddingLeft: 0 },
  backText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { marginTop: 4, color: '#444' },
  card: { marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: '#f8f8f8' },
  section: { fontWeight: '700', marginBottom: 8 },
  label: { fontSize: 12, color: '#666', marginBottom: 6 },
  keyPath: { fontFamily: 'Menlo', fontSize: 11, color: '#999' },
  keyPathInline: { fontFamily: 'Menlo', fontSize: 11, color: '#999' },
  input: { borderWidth: 1, borderColor: '#e1e1e1', borderRadius: 8, paddingHorizontal: 10, height: 38, backgroundColor: '#fff' },
  cartRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  cartItemCard: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', gap: 10 },
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#f0f0f0' },
  inputsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  inputCol: { flex: 1 },
  itemTitle: { fontWeight: '600' },
  meta: { color: '#555', marginTop: 2, fontSize: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  discountedPrice: { fontWeight: '700', color: '#111' },
  originalPrice: { color: '#777', textDecorationLine: 'line-through' },
  sizeText: { color: '#555' },
  lineTotal: { marginTop: 6, fontWeight: '600', color: '#111' },
  saveBtn: { backgroundColor: '#222', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontWeight: '700' },
  removeBtn: { position: 'absolute', right: 10, top: 10, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: '#ffecec' },
  removeText: { color: '#d11a2a', fontWeight: '600', fontSize: 12 },
  valueText: { fontWeight: '700', color: '#111', fontSize: 14 },
  statusPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#f0f0f0' },
  statusPillActive: { backgroundColor: '#222' },
  statusPillText: { fontSize: 12, color: '#222', textTransform: 'capitalize' },
  statusPillTextActive: { color: '#fff' },
  historyRow: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, marginTop: 10, backgroundColor: '#fff' },
  addBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#e8f5e9' },
  addText: { color: '#2e7d32', fontWeight: '600' },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 999 },
  historyStatusText: { fontWeight: '700', textTransform: 'capitalize' },
  latestBadge: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: '#eef2ff', color: '#3730a3', fontSize: 11, fontWeight: '700' },
  historyTimestamp: { marginTop: 4, color: '#666', fontSize: 12 },
  historyRowLatest: { borderColor: '#c7d2fe', backgroundColor: '#f5f7ff' },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 8,
    color: '#111',
    fontWeight: '600',
  },
});


