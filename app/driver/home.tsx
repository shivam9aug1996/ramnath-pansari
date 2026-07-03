import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSelector } from "react-redux";
import AdminScreen from "@/app/admin/components/AdminScreen";
import HeaderBar from "@/app/admin/components/HeaderBar";
import { adminListStyles, adminTheme } from "@/app/admin/theme";
import { Colors } from "@/constants/Colors";
import { RootState, DriverOrderSummary } from "@/types/global";
import { useListDriverOrdersQuery } from "@/redux/features/driverOrderSlice";
import { useLogoutMutation } from "@/redux/features/authSlice";
import {
  resumeDriverLocationTrackingIfNeeded,
  stopDriverLocationTracking,
} from "@/utils/driverLocationTask";
import StatusBadge from "@/app/admin/components/StatusBadge";
import { confirmAction } from "@/utils/platformAlert";

const DriverHomeScreen = () => {
  const router = useRouter();
  const driverId = useSelector(
    (state: RootState) => state.auth?.userData?.driverId,
  );
  const userId = useSelector((state: RootState) => state.auth?.userData?._id);
  const driverName = useSelector((state: RootState) => state.auth?.userData?.name);

  const { data, isLoading, isFetching, refetch } = useListDriverOrdersQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [pullRefreshing, setPullRefreshing] = useState(false);

  useEffect(() => {
    if (pullRefreshing && !isFetching) setPullRefreshing(false);
  }, [pullRefreshing, isFetching]);

  useEffect(() => {
    const id = driverId || userId;
    if (!id) return;
    resumeDriverLocationTrackingIfNeeded(String(id)).catch(() => {});
  }, [driverId, userId]);

  const onRefresh = useCallback(() => {
    setPullRefreshing(true);
    refetch();
  }, [refetch]);

  const onLogoutPress = useCallback(async () => {
    const confirmed = await confirmAction(
      "Log out",
      "Are you sure you want to log out?",
      "Log out",
    );
    if (!confirmed) return;

    try {
      await stopDriverLocationTracking();
      await logout({}).unwrap();
    } catch {
      // Auth middleware still clears local session on failure
    }
  }, [logout]);

  const orders = data?.orders ?? [];
  const activeId = data?.activeDeliveryOrderId;

  const renderItem = ({ item }: { item: DriverOrderSummary }) => {
    const isActive = item.orderStatus === "out_for_delivery";
    const isBlocked =
      Boolean(activeId) && activeId !== item.orderId && item.orderStatus === "confirmed";

    return (
      <TouchableOpacity
        style={[adminListStyles.listCard, styles.card, isActive && styles.cardActive]}
        activeOpacity={0.8}
        onPress={() => router.push(`/driver/orders/${item._id}`)}
      >
        <View style={styles.cardTop}>
          <Text style={styles.orderId}>#{item.orderId}</Text>
          <StatusBadge status={item.orderStatus} />
        </View>
        <Text style={styles.customer} numberOfLines={1}>
          {item.customerName || "Customer"}
        </Text>
        <Text style={styles.address} numberOfLines={2}>
          {item.deliveryAddress}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {item.itemCount} items · ₹{item.amountPaid ?? "—"}
          </Text>
          {isBlocked ? (
            <Text style={styles.blockedHint}>Finish active delivery first</Text>
          ) : null}
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color="#CBD5E1"
          style={styles.chevron}
        />
      </TouchableOpacity>
    );
  };

  return (
    <AdminScreen>
      <HeaderBar
        title="Deliveries"
        subtitle={driverName ? `Hi, ${driverName.split(" ")[0]}` : "Driver"}
        right={
          <TouchableOpacity
            onPress={onLogoutPress}
            style={styles.logoutBtn}
            accessibilityLabel="Log out"
            activeOpacity={0.7}
            disabled={isLoggingOut}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={adminTheme.textPrimary}
            />
          </TouchableOpacity>
        }
      />

      {activeId ? (
        <View style={styles.activeBanner}>
          <Ionicons name="bicycle-outline" size={18} color="#1D4ED8" />
          <Text style={styles.activeBannerText}>
            Active delivery: #{activeId}
          </Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.light.darkGreen} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={adminListStyles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={pullRefreshing}
              onRefresh={onRefresh}
              tintColor={adminTheme.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="bicycle-outline" size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No assigned deliveries</Text>
              <Text style={styles.emptySubtitle}>
                Orders assigned to you will appear here
              </Text>
            </View>
          }
        />
      )}

      {isLoggingOut ? (
        <View style={styles.loggingOutOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color={Colors.light.darkGreen} />
          <Text style={styles.loggingOutText}>Logging out…</Text>
        </View>
      ) : null}
    </AdminScreen>
  );
};

export default DriverHomeScreen;

const styles = StyleSheet.create({
  centerState: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: adminTheme.border,
    alignItems: "center",
    justifyContent: "center",
    ...adminTheme.shadow,
  },
  loggingOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loggingOutText: {
    fontSize: 14,
    fontWeight: "600",
    color: adminTheme.textSecondary,
  },
  card: { padding: 14, marginBottom: 10, position: "relative" },
  cardActive: { borderColor: "#BFDBFE", backgroundColor: "#F8FBFF" },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  orderId: { fontSize: 16, fontWeight: "900", color: adminTheme.textPrimary },
  customer: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
    color: adminTheme.textPrimary,
  },
  address: {
    marginTop: 4,
    fontSize: 12,
    color: adminTheme.textSecondary,
    lineHeight: 17,
  },
  metaRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  meta: { fontSize: 12, fontWeight: "600", color: adminTheme.textMuted },
  blockedHint: { fontSize: 10, fontWeight: "700", color: "#B45309" },
  chevron: { position: "absolute", right: 12, top: "50%" },
  activeBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activeBannerText: { fontSize: 12, fontWeight: "700", color: "#1D4ED8" },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: adminTheme.textPrimary },
  emptySubtitle: {
    fontSize: 13,
    color: adminTheme.textSecondary,
    textAlign: "center",
  },
});
