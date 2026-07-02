import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AdminScreen from '@/app/admin/components/AdminScreen';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { showToast } from '@/utils/utils';
import { useGetOrderQuery, useUpdateOrderMutation, useListAdminDriversQuery, useAssignDriverToOrderMutation } from '@/redux/features/adminOrderSlice';
import { ORDER_STATUS_VALUES, ORDER_STATUS_COLORS } from '@/constants/Order';
import { Colors } from '@/constants/Colors';
import HeaderBar from '@/app/admin/components/HeaderBar';
import StatusBadge from '@/app/admin/components/StatusBadge';
import PaymentBreakdown from '@/app/admin/components/PaymentBreakdown';
import DetailSection from './components/DetailSection';
import Field from './components/Field';
import { AdminOrderDocument } from '@/types/global';
import {
  getCartSubtotal,
  getDeliveryFee,
  getPayableTotal,
} from '@/utils/deliveryFee';
import { useDeliverySettings } from '@/hooks/useDeliverySettings';

const OrderDetailScreen = () => {
  const params = useLocalSearchParams<{ id: string }>();
  const deliverySettings = useDeliverySettings({ fetch: true });
  const { data, isFetching, isLoading, refetch } = useGetOrderQuery({
    id: String(params.id),
  });
  const [updateOrder, { isLoading: isSaving }] = useUpdateOrderMutation();
  const [assignDriver, { isLoading: isAssigning }] = useAssignDriverToOrderMutation();
  const [draft, setDraft] = React.useState<AdminOrderDocument | null>(null);
  const { data: driversData } = useListAdminDriversQuery(undefined, {
    skip: !draft,
  });

  React.useEffect(() => {
    if (data) setDraft(JSON.parse(JSON.stringify(data)));
  }, [data]);

  const onChange = (path: string[], value: unknown) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next: Record<string, unknown> = JSON.parse(JSON.stringify(prev));

      const isIndex = (k: string) => {
        const n = Number(k);
        return Number.isInteger(n) && String(n) === k;
      };

      let cursor: unknown = next;
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

        const obj = cursor as Record<string, unknown>;
        if (isIndex(nextKey)) {
          if (!Array.isArray(obj[key])) obj[key] = [];
        } else {
          obj[key] = { ...((obj[key] as object) ?? {}) };
        }
        cursor = obj[key];
      }

      const lastKey = path[path.length - 1];
      if (Array.isArray(cursor) && isIndex(lastKey)) {
        cursor[Number(lastKey)] = value;
      } else {
        (cursor as Record<string, unknown>)[lastKey] = value;
      }

      return recalcOrderDerived(next as AdminOrderDocument);
    });
  };

  const recalcOrderDerived = (order: AdminOrderDocument): AdminOrderDocument => {
    try {
      const items: { quantity?: number }[] =
        (order as AdminOrderDocument & { cartData?: { cart?: { items?: unknown[] } } })
          ?.cartData?.cart?.items || [];
      const subtotal = getCartSubtotal(items as Parameters<typeof getCartSubtotal>[0]);
      const deliveryFee = getDeliveryFee(subtotal, deliverySettings);
      const amountPaid = getPayableTotal(subtotal, deliverySettings);

      (order as AdminOrderDocument & { productCount?: number }).productCount = items.length;
      (order as AdminOrderDocument & { totalProductCount?: number }).totalProductCount =
        items.reduce((sum, it) => sum + (Number(it?.quantity) || 0), 0);
      order.subtotal = subtotal;
      order.deliveryFee = deliveryFee;
      order.amountPaid = amountPaid.toFixed(2);
      order.transactionData = {
        ...order.transactionData,
        amount: amountPaid.toFixed(2),
      };
    } catch {
      // keep existing totals
    }
    return order;
  };

  const onRemoveItem = (index: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as AdminOrderDocument;
      const items = next?.cartData?.cart?.items ?? [];
      if (index >= 0 && index < items.length) items.splice(index, 1);
      next.cartData.cart.items = items;
      return recalcOrderDerived(next);
    });
  };

  const onSave = async () => {
    try {
      if (!draft) return;
      if (!Array.isArray(draft.orderHistory) || draft.orderHistory.length === 0) {
        showToast({
          type: 'error',
          text2: 'Please add at least one entry in order history before saving.',
        });
        return;
      }
      const body = JSON.parse(JSON.stringify(draft)) as AdminOrderDocument;
      if (data?.orderStatus !== draft.orderStatus) {
        const history = Array.isArray(body.orderHistory) ? [...body.orderHistory] : [];
        const first = history[0];
        if (!first || String(first.status) !== String(draft.orderStatus)) {
          history.unshift({
            status: draft.orderStatus,
            timestamp: new Date().toISOString(),
          });
        }
        body.orderHistory = history;
      }
      await updateOrder({ id: draft._id, body }).unwrap();
      Alert.alert('Saved', 'Order updated successfully');
      refetch();
    } catch (e: unknown) {
      const msg =
        (e as { data?: { error?: { message?: string } } })?.data?.error?.message ||
        'Failed to update order';
      Alert.alert('Error', msg);
    }
  };

  const onDeleteHistory = (index: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as AdminOrderDocument;
      const list = Array.isArray(next.orderHistory) ? [...next.orderHistory] : [];
      if (index >= 0 && index < list.length) list.splice(index, 1);
      next.orderHistory = list;
      const lastStatus = list.length ? String(list[0]?.status || '') : '';
      if (lastStatus) next.orderStatus = lastStatus;
      return next;
    });
  };

  const onAddHistory = () => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as AdminOrderDocument;
      const list = Array.isArray(next.orderHistory) ? [...next.orderHistory] : [];
      list.unshift({
        status: next.orderStatus || 'confirmed',
        timestamp: new Date().toISOString(),
      });
      next.orderHistory = list;
      return next;
    });
  };

  const onAssignDriver = async (driverUserId: string) => {
    if (!draft) return;
    try {
      const result = await assignDriver({
        orderId: draft._id,
        driverUserId,
      }).unwrap();
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              assignedDriver: result.assignedDriver ?? prev.assignedDriver,
            }
          : prev,
      );
      showToast({ type: 'success', text2: 'Driver assigned' });
      refetch();
    } catch (e: unknown) {
      const msg =
        (e as { data?: { error?: { message?: string } } })?.data?.error?.message ||
        'Failed to assign driver';
      Alert.alert('Error', msg);
    }
  };

  if (isLoading || !draft) {
    return (
      <AdminScreen style={styles.container}>
        <HeaderBar title="Order" />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.light.darkGreen} />
          <Text style={styles.centerStateText}>Loading order…</Text>
        </View>
      </AdminScreen>
    );
  }

  const createdAt = draft.createdAt ? new Date(draft.createdAt) : null;
  const placedLabel = createdAt
    ? `${createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · ${createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '';
  const cartItems = draft?.cartData?.cart?.items ?? [];
  const phone = draft.addressData?.phone;

  return (
    <AdminScreen style={styles.container}>
      <HeaderBar title={draft.orderId} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isSaving}
            onRefresh={refetch}
            tintColor={Colors.light.darkGreen}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryName}>
                {draft.addressData?.name || 'Customer'}
              </Text>
              {placedLabel ? (
                <Text style={styles.summaryMeta}>Placed {placedLabel}</Text>
              ) : null}
            </View>
            <StatusBadge status={String(draft.orderStatus)} />
          </View>

          {phone ? (
            <TouchableOpacity
              style={styles.callRow}
              onPress={() => Linking.openURL(`tel:${phone}`)}
            >
              <Ionicons name="call-outline" size={16} color={Colors.light.darkGreen} />
              <Text style={styles.callText}>{phone}</Text>
            </TouchableOpacity>
          ) : null}

          <PaymentBreakdown
            subtotal={draft.subtotal}
            deliveryFee={draft.deliveryFee}
            amountPaid={draft.amountPaid ?? draft.transactionData?.amount}
          />
        </View>

        {/* Status */}
        <DetailSection title="Update status">
          <View style={styles.statusPillsRow}>
            {ORDER_STATUS_VALUES.map((s) => {
              const active = String(draft.orderStatus) === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() =>
                    setDraft((prev) => (prev ? { ...prev, orderStatus: s } : prev))
                  }
                  style={[styles.statusPill, active && styles.statusPillActive]}
                >
                  <Text
                    style={[styles.statusPillText, active && styles.statusPillTextActive]}
                  >
                    {s.replaceAll('_', ' ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </DetailSection>

        <DetailSection
          title="Delivery driver"
          subtitle="Assign before the driver starts delivery from the driver app"
        >
          {draft.assignedDriver ? (
            <View style={styles.driverAssignedCard}>
              <Text style={styles.driverAssignedName}>{draft.assignedDriver.name}</Text>
              <Text style={styles.driverAssignedMeta}>
                {draft.assignedDriver.phone}
                {draft.driverTrackingStatus
                  ? ` · ${String(draft.driverTrackingStatus).replaceAll('_', ' ')}`
                  : ''}
              </Text>
            </View>
          ) : (
            <Text style={styles.driverEmptyText}>No driver assigned yet</Text>
          )}

          {(driversData?.drivers ?? []).map((driver) => {
            const isCurrent = draft.assignedDriver?.driverId === driver.driverId;
            return (
              <TouchableOpacity
                key={driver._id}
                style={[styles.driverPickRow, isCurrent && styles.driverPickRowActive]}
                disabled={isAssigning || isCurrent}
                onPress={() => onAssignDriver(driver._id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.driverPickName}>{driver.name}</Text>
                  <Text style={styles.driverPickMeta}>{driver.mobileNumber}</Text>
                </View>
                {isCurrent ? (
                  <Text style={styles.driverPickBadge}>Assigned</Text>
                ) : (
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                )}
              </TouchableOpacity>
            );
          })}

          {!driversData?.drivers?.length ? (
            <Text style={styles.driverEmptyText}>
              Create a driver user in Admin → Users with driver access enabled.
            </Text>
          ) : null}
        </DetailSection>

        {/* History timeline */}
        <DetailSection
          title="Status history"
          subtitle="Newest first · auto-updated on save when status changes"
        >
          <TouchableOpacity onPress={onAddHistory} style={styles.addBtn}>
            <Ionicons name="add" size={16} color={Colors.light.darkGreen} />
            <Text style={styles.addText}>Add entry</Text>
          </TouchableOpacity>

          {(Array.isArray(draft.orderHistory) ? draft.orderHistory : []).map((h, i) => {
            const isLatest = i === 0;
            const statusStr = String(h?.status || '') as keyof typeof ORDER_STATUS_COLORS;
            const color = ORDER_STATUS_COLORS[statusStr] || '#94A3B8';
            const ts = h?.timestamp ? new Date(h.timestamp) : null;
            const dateStr = ts
              ? ts.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
              : '';
            const timeStr = ts
              ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <View
                key={`hist-${i}`}
                style={[styles.historyRow, isLatest && styles.historyRowLatest]}
              >
                <View style={styles.historyHeader}>
                  <View style={[styles.statusDot, { backgroundColor: color }]} />
                  <Text style={styles.historyStatusText}>
                    {String(h?.status || '').replaceAll('_', ' ')}
                  </Text>
                  {isLatest ? <Text style={styles.latestBadge}>Latest</Text> : null}
                  {!isLatest ? (
                    <TouchableOpacity
                      onPress={() => onDeleteHistory(i)}
                      style={styles.deleteHistoryBtn}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <Text style={styles.historyTimestamp}>
                  {dateStr} · {timeStr}
                </Text>
              </View>
            );
          })}
        </DetailSection>

        {/* Address */}
        <DetailSection title="Delivery address">
          <Field label="Name">
            <TextInput
              value={String(draft.addressData?.name ?? '')}
              onChangeText={(t) => onChange(['addressData', 'name'], t)}
              style={styles.input}
            />
          </Field>
          <Field label="Phone">
            <TextInput
              keyboardType="phone-pad"
              value={String(draft.addressData?.phone ?? '')}
              onChangeText={(t) => onChange(['addressData', 'phone'], t)}
              style={styles.input}
            />
          </Field>
          <Field label="Address">
            <TextInput
              multiline
              value={String(draft.addressData?.address ?? '')}
              onChangeText={(t) => onChange(['addressData', 'address'], t)}
              style={[styles.input, styles.textArea]}
            />
          </Field>
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Field label="Latitude">
                <TextInput
                  keyboardType="numeric"
                  value={String(draft.addressData?.latitude ?? '')}
                  onChangeText={(t) => onChange(['addressData', 'latitude'], Number(t))}
                  style={styles.input}
                />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Longitude">
                <TextInput
                  keyboardType="numeric"
                  value={String(draft.addressData?.longitude ?? '')}
                  onChangeText={(t) => onChange(['addressData', 'longitude'], Number(t))}
                  style={styles.input}
                />
              </Field>
            </View>
          </View>
        </DetailSection>

        {/* Cart */}
        <DetailSection
          title="Cart items"
          subtitle={`${draft.totalProductCount ?? cartItems.length} items · ${cartItems.length} products`}
        >
          {cartItems.map((it, idx) => {
            const dPrice = Number(it.productDetails?.discountedPrice ?? 0);
            const qty = Number(it.quantity ?? 0);
            const lineTotal = (isNaN(dPrice) ? 0 : dPrice) * (isNaN(qty) ? 0 : qty);
            return (
              <View key={`${it.productId}-${idx}`} style={styles.cartItemCard}>
                <View style={styles.cartHeader}>
                  {it.productDetails?.image ? (
                    <Image
                      source={{ uri: String(it.productDetails.image) }}
                      style={styles.thumb}
                    />
                  ) : (
                    <View style={[styles.thumb, styles.thumbPlaceholder]}>
                      <Ionicons name="cube-outline" size={20} color="#94A3B8" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{it.productDetails?.name}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.discountedPrice}>
                        ₹{it.productDetails?.discountedPrice}
                      </Text>
                      {typeof it.productDetails?.price === 'number' &&
                      it.productDetails.price >
                        (it.productDetails?.discountedPrice ?? 0) ? (
                        <Text style={styles.originalPrice}>₹{it.productDetails.price}</Text>
                      ) : null}
                      {it.productDetails?.size ? (
                        <Text style={styles.sizeText}> · {it.productDetails.size}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.lineTotal}>Line total: ₹{lineTotal.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onRemoveItem(idx)}
                    style={styles.removeBtn}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputsRow}>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Qty</Text>
                    <TextInput
                      keyboardType="number-pad"
                      value={String(it.quantity)}
                      onChangeText={(t) => {
                        const n = Math.max(0, parseInt(t || '0', 10));
                        onChange(
                          ['cartData', 'cart', 'items', String(idx), 'quantity'],
                          isNaN(n) ? 0 : n,
                        );
                      }}
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Disc. price</Text>
                    <TextInput
                      keyboardType="decimal-pad"
                      value={String(it.productDetails?.discountedPrice ?? '')}
                      onChangeText={(t) => {
                        const val = parseFloat(t || '0');
                        onChange(
                          [
                            'cartData',
                            'cart',
                            'items',
                            String(idx),
                            'productDetails',
                            'discountedPrice',
                          ],
                          isNaN(val) ? 0 : val,
                        );
                      }}
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>MRP</Text>
                    <TextInput
                      keyboardType="decimal-pad"
                      value={String(it.productDetails?.price ?? '')}
                      onChangeText={(t) => {
                        const val = parseFloat(t || '0');
                        onChange(
                          [
                            'cartData',
                            'cart',
                            'items',
                            String(idx),
                            'productDetails',
                            'price',
                          ],
                          isNaN(val) ? 0 : val,
                        );
                      }}
                      style={styles.input}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </DetailSection>

        {/* Payment details */}
        <DetailSection title="Payment details">
          <Field label="Method">
            <TextInput
              value={String(draft.transactionData?.method ?? '')}
              onChangeText={(t) => onChange(['transactionData', 'method'], t)}
              style={styles.input}
            />
          </Field>
          <Field label="Amount (₹)">
            <TextInput
              keyboardType="numeric"
              value={String(draft.transactionData?.amount ?? '')}
              onChangeText={(t) => onChange(['transactionData', 'amount'], t)}
              style={styles.input}
            />
          </Field>
          <Field label="Currency">
            <TextInput
              value={String(draft.transactionData?.currency ?? '')}
              onChangeText={(t) => onChange(['transactionData', 'currency'], t)}
              style={styles.input}
            />
          </Field>
        </DetailSection>

        <View style={{ height: 88 }} />
      </ScrollView>

      <View style={styles.saveBar}>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveText}>Save changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </AdminScreen>
  );
};

export default OrderDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16, paddingBottom: 0 },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerStateText: {
    marginTop: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  summaryName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  summaryMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  callText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.darkGreen,
  },
  statusPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusPillActive: {
    backgroundColor: Colors.light.darkGreen,
    borderColor: Colors.light.darkGreen,
  },
  statusPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusPillTextActive: { color: '#fff' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    marginBottom: 8,
  },
  addText: {
    color: Colors.light.darkGreen,
    fontWeight: '700',
    fontSize: 13,
  },
  historyRow: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    backgroundColor: '#F8FAFC',
  },
  historyRowLatest: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 999 },
  historyStatusText: {
    fontWeight: '700',
    textTransform: 'capitalize',
    color: '#111827',
    flex: 1,
  },
  latestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
    color: Colors.light.darkGreen,
    fontSize: 10,
    fontWeight: '800',
    overflow: 'hidden',
  },
  historyTimestamp: { marginTop: 4, color: '#64748B', fontSize: 12 },
  deleteHistoryBtn: { marginLeft: 'auto' },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    backgroundColor: '#F8FAFC',
    fontSize: 14,
    color: '#111827',
  },
  textArea: { height: 80, paddingTop: 10, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', gap: 10 },
  cartItemCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  cartHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  thumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: '#E2E8F0' },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontWeight: '700', color: '#111827', fontSize: 14 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  discountedPrice: { fontWeight: '700', color: '#111827' },
  originalPrice: { color: '#94A3B8', textDecorationLine: 'line-through', fontSize: 12 },
  sizeText: { color: '#64748B', fontSize: 12 },
  lineTotal: { marginTop: 4, fontWeight: '600', color: '#475569', fontSize: 12 },
  removeBtn: { padding: 4 },
  inputsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  inputCol: { flex: 1 },
  inputLabel: { fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: '600' },
  driverAssignedCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 10,
  },
  driverAssignedName: { fontSize: 14, fontWeight: '800', color: '#111827' },
  driverAssignedMeta: { marginTop: 4, fontSize: 12, color: '#475569', fontWeight: '600' },
  driverEmptyText: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  driverPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    marginTop: 8,
  },
  driverPickRowActive: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FBFF',
  },
  driverPickName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  driverPickMeta: { marginTop: 2, fontSize: 12, color: '#64748B' },
  driverPickBadge: { fontSize: 11, fontWeight: '800', color: '#2563EB' },
  saveBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.darkGreen,
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
