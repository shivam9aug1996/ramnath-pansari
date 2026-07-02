import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSelector } from "react-redux";
import AdminScreen from "@/app/admin/components/AdminScreen";
import HeaderBar from "@/app/admin/components/HeaderBar";
import StatusBadge from "@/app/admin/components/StatusBadge";
import { Colors } from "@/constants/Colors";
import { adminTheme } from "@/app/admin/theme";
import { RootState } from "@/types/global";
import {
  useGetDriverOrderQuery,
  useListDriverOrdersQuery,
  useMarkDriverDeliveredMutation,
  useStartDriverDeliveryMutation,
} from "@/redux/features/driverOrderSlice";
import { openGoogleMapsNavigation } from "@/utils/driverMaps";
import {
  startDriverLocationTracking,
  stopDriverLocationTracking,
} from "@/utils/driverLocationTask";
import { getDriverErrorMessage } from "@/utils/driverDebug";

const DriverOrderDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderMongoId = String(id);
  const router = useRouter();

  const driverId = useSelector(
    (state: RootState) => state.auth?.userData?.driverId,
  );
  const userId = useSelector((state: RootState) => state.auth?.userData?._id);
  const effectiveDriverId = driverId || userId || "";

  const { data: listData } = useListDriverOrdersQuery();
  const { data, isLoading, refetch } = useGetDriverOrderQuery({ id: orderMongoId });
  const [startDelivery, { isLoading: isStarting }] = useStartDriverDeliveryMutation();
  const [markDelivered, { isLoading: isDelivering }] = useMarkDriverDeliveredMutation();

  const order = data?.order;
  const activeDeliveryOrderId = listData?.activeDeliveryOrderId;
  const isActiveDelivery = order?.orderStatus === "out_for_delivery";
  const canStart =
    order?.orderStatus === "confirmed" &&
    (!activeDeliveryOrderId || activeDeliveryOrderId === order?.orderId);
  const canDeliver = order?.orderStatus === "out_for_delivery";
  const hasCoords =
    order?.latitude != null &&
    order?.longitude != null &&
    Number.isFinite(order.latitude) &&
    Number.isFinite(order.longitude);

  const phoneHref = useMemo(() => {
    const phone = order?.customerPhone?.replace(/\D/g, "");
    return phone ? `tel:${phone}` : null;
  }, [order?.customerPhone]);

  const onNavigate = () => {
    if (!hasCoords || order?.latitude == null || order?.longitude == null) {
      Alert.alert("Missing location", "This order has no delivery coordinates.");
      return;
    }
    openGoogleMapsNavigation(order.latitude, order.longitude);
  };

  const onStartDelivery = async () => {
    try {
      const result = await startDelivery({ id: orderMongoId }).unwrap();
      await startDriverLocationTracking(
        result.orderId,
        String(effectiveDriverId),
      );
      if (hasCoords && order?.latitude != null && order?.longitude != null) {
        openGoogleMapsNavigation(order.latitude, order.longitude);
      }
      Alert.alert("Started", "Delivery is live. Location is being shared.");
      refetch();
    } catch (e: unknown) {
      Alert.alert("Error", getDriverErrorMessage(e, "Could not start delivery"));
    }
  };

  const onMarkDelivered = () => {
    Alert.alert("Mark delivered", "Confirm that this order was delivered?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delivered",
        onPress: async () => {
          try {
            await markDelivered({ id: orderMongoId }).unwrap();
            await stopDriverLocationTracking();
            Alert.alert("Done", "Order marked as delivered");
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/driver/home");
            }
          } catch (e: unknown) {
            Alert.alert(
              "Error",
              getDriverErrorMessage(e, "Could not mark delivered"),
            );
          }
        },
      },
    ]);
  };

  if (isLoading || !order) {
    return (
      <AdminScreen style={styles.container}>
        <HeaderBar title="Order" />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.light.darkGreen} />
        </View>
      </AdminScreen>
    );
  }

  return (
    <AdminScreen style={styles.container}>
      <HeaderBar title={`#${order.orderId}`} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroTitle}>{order.customerName || "Customer"}</Text>
            <StatusBadge status={order.orderStatus} />
          </View>
          <Text style={styles.heroAddress}>{order.deliveryAddress}</Text>
          <Text style={styles.heroMeta}>
            {order.itemCount} items · ₹{order.amountPaid ?? "—"}
          </Text>
        </View>

        <View style={styles.actions}>
          <ActionButton
            label="Navigate"
            icon="navigate-outline"
            tint="#2563EB"
            onPress={onNavigate}
            disabled={!hasCoords}
          />
          {phoneHref ? (
            <ActionButton
              label="Call customer"
              icon="call-outline"
              tint="#059669"
              onPress={() => Linking.openURL(phoneHref)}
            />
          ) : null}
        </View>

        {isActiveDelivery ? (
          <View style={styles.liveBanner}>
            <Ionicons name="radio-outline" size={18} color="#1D4ED8" />
            <Text style={styles.liveBannerText}>
              Live location is being shared with customer and admin
            </Text>
          </View>
        ) : null}

        <View style={styles.footerActions}>
          {canStart ? (
            <PrimaryButton
              label="Start delivery"
              loading={isStarting}
              onPress={onStartDelivery}
              color={Colors.light.darkGreen}
            />
          ) : null}

          {canDeliver ? (
            <PrimaryButton
              label="Mark delivered"
              loading={isDelivering}
              onPress={onMarkDelivered}
              color="#1D4ED8"
            />
          ) : null}

          {!canStart && !canDeliver ? (
            <Text style={styles.hint}>
              This order cannot be updated from the driver app right now.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </AdminScreen>
  );
};

function ActionButton({
  label,
  icon,
  tint,
  onPress,
  disabled,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={20} color={tint} />
      <Text style={[styles.actionBtnText, { color: tint }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function PrimaryButton({
  label,
  loading,
  onPress,
  color,
}: {
  label: string;
  loading?: boolean;
  onPress: () => void;
  color: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, { backgroundColor: color }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.primaryBtnText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

export default DriverOrderDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 32, gap: 14 },
  hero: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: adminTheme.border,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  heroTitle: { fontSize: 18, fontWeight: "900", color: adminTheme.textPrimary },
  heroAddress: {
    marginTop: 10,
    fontSize: 14,
    color: adminTheme.textSecondary,
    lineHeight: 20,
  },
  heroMeta: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    color: adminTheme.textPrimary,
  },
  actions: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: adminTheme.border,
  },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnText: { fontSize: 12, fontWeight: "800" },
  liveBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  liveBannerText: { flex: 1, fontSize: 12, fontWeight: "600", color: "#1D4ED8" },
  footerActions: { gap: 10, marginTop: 4 },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  hint: { textAlign: "center", color: adminTheme.textSecondary, fontSize: 13 },
});
