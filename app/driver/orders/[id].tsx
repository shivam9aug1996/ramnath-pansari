import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Platform,
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
  getDriverLocationPermissionState,
  requestAlwaysDriverLocationPermission,
  requestForegroundDriverLocationPermission,
  startDriverLocationTracking,
  stopDriverLocationTracking,
} from "@/utils/driverLocationTask";
import { getDriverErrorMessage } from "@/utils/driverDebug";
import { confirmAction, showAlert } from "@/utils/platformAlert";
import { devError, devLog, devWarn } from "@/utils/devLog";

type LocationAccess = "never" | "while-using" | "always" | "unknown";

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
  const [locationAccess, setLocationAccess] = useState<LocationAccess>("unknown");
  const [isUpdatingPermission, setIsUpdatingPermission] = useState(false);

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

  const refreshPermissionState = useCallback(async (): Promise<LocationAccess> => {
    if (Platform.OS === "web") {
      setLocationAccess("while-using");
      return "while-using";
    }
    try {
      const state = await getDriverLocationPermissionState();
      const next: LocationAccess = !state.foregroundGranted
        ? "never"
        : state.backgroundGranted
          ? "always"
          : "while-using";
      setLocationAccess(next);
      return next;
    } catch (error) {
      devError("[driver-order] failed to read location permission", error);
      return "unknown";
    }
  }, []);

  const ensureTrackingIfPossible = useCallback(
    async (reason: string) => {
      if (!isActiveDelivery || !order?.orderId || !effectiveDriverId) return;
      if (Platform.OS === "web") {
        await startDriverLocationTracking(order.orderId, String(effectiveDriverId));
        return;
      }

      const access = await refreshPermissionState();
      if (access === "never") {
        devWarn("[driver-order] location is Never — not starting Firebase share", {
          reason,
        });
        return;
      }

      await startDriverLocationTracking(order.orderId, String(effectiveDriverId));
      await refreshPermissionState();
    },
    [
      isActiveDelivery,
      order?.orderId,
      effectiveDriverId,
      refreshPermissionState,
    ],
  );

  useEffect(() => {
    refreshPermissionState();
  }, [refreshPermissionState, isActiveDelivery]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") return;
      (async () => {
        const prev = locationAccess;
        const access = await refreshPermissionState();
        if (
          prev === "never" &&
          access !== "never" &&
          isActiveDelivery &&
          order?.orderId
        ) {
          devLog("[driver-order] location enabled after Settings — starting tracking");
          await ensureTrackingIfPossible("settings-return");
        } else if (
          prev !== "always" &&
          access === "always" &&
          isActiveDelivery &&
          order?.orderId
        ) {
          devLog("[driver-order] Always granted after Settings — restarting tracking");
          await ensureTrackingIfPossible("always-after-settings");
        }
      })().catch((error) => {
        devError("[driver-order] AppState permission refresh failed", error);
      });
    });
    return () => sub.remove();
  }, [
    locationAccess,
    refreshPermissionState,
    ensureTrackingIfPossible,
    isActiveDelivery,
    order?.orderId,
  ]);

  // If delivery is already live, share location when permission allows.
  const resumedForOrderRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isActiveDelivery || !order?.orderId || !effectiveDriverId) return;
    if (resumedForOrderRef.current === order.orderId) return;
    resumedForOrderRef.current = order.orderId;

    ensureTrackingIfPossible("active-delivery-mount").catch((error) => {
      devError("[driver-order] failed to resume location share", error);
      refreshPermissionState();
    });
  }, [
    isActiveDelivery,
    order?.orderId,
    effectiveDriverId,
    ensureTrackingIfPossible,
    refreshPermissionState,
  ]);

  const phoneHref = useMemo(() => {
    const phone = order?.customerPhone?.replace(/\D/g, "");
    return phone ? `tel:${phone}` : null;
  }, [order?.customerPhone]);

  const onNavigate = () => {
    if (!hasCoords || order?.latitude == null || order?.longitude == null) {
      showAlert("Missing location", "This order has no delivery coordinates.");
      return;
    }
    openGoogleMapsNavigation(order.latitude, order.longitude);
  };

  const onEnableLocation = async () => {
    if (Platform.OS === "web" || !order?.orderId || !effectiveDriverId) return;

    setIsUpdatingPermission(true);
    try {
      const result = await requestForegroundDriverLocationPermission();
      const access = await refreshPermissionState();

      if (result.granted || access !== "never") {
        await ensureTrackingIfPossible("enable-location");
        showAlert(
          "Location enabled",
          access === "always"
            ? "Location will keep sharing even when you leave this app."
            : "Location will be shared while this app stays open. You can upgrade to Always below.",
        );
        return;
      }

      if (result.openedSettings) {
        showAlert(
          "Enable location in Settings",
          'Open Location and choose "While Using the App" or "Always", then return here.',
        );
        return;
      }

      showAlert(
        "Location still off",
        "Live location cannot be sent while permission is Never. Enable it in Settings to continue sharing.",
      );
    } catch (error) {
      devError("[driver-order] enable location failed", error);
      showAlert("Error", "Could not update location permission.");
    } finally {
      setIsUpdatingPermission(false);
    }
  };

  const onAllowAlways = async () => {
    if (Platform.OS === "web" || !order?.orderId || !effectiveDriverId) return;

    setIsUpdatingPermission(true);
    try {
      const result = await requestAlwaysDriverLocationPermission();
      const access = await refreshPermissionState();

      if (result.granted || access === "always") {
        await ensureTrackingIfPossible("allow-always");
        showAlert(
          "Always allowed",
          "Location will keep sharing even when you open Google Maps or leave this app.",
        );
        return;
      }

      if (access === "never") {
        if (result.openedSettings) {
          showAlert(
            "Enable location in Settings",
            'Location is set to Never. Open Location and choose "While Using the App" or "Always", then return here.',
          );
        } else {
          showAlert(
            "Location is off",
            "Enable location permission first. Live location cannot be sent while it is Never.",
          );
        }
        return;
      }

      if (result.openedSettings) {
        showAlert(
          "Enable Always in Settings",
          'Open Location → set to "Always". Then return here so sharing continues in the background.',
        );
        return;
      }

      showAlert(
        "Always not enabled",
        'Location is still "While Using" only. It is sent only while this app stays open. You can enable Always anytime from Settings.',
      );
    } catch (error) {
      devError("[driver-order] request Always failed", error);
      showAlert("Error", "Could not update location permission.");
    } finally {
      setIsUpdatingPermission(false);
    }
  };

  const onStartDelivery = async () => {
    try {
      const result = await startDelivery({ id: orderMongoId }).unwrap();
      devLog("[driver-order] startDelivery OK — starting Firebase location share", {
        orderMongoId,
        orderId: result.orderId,
        driverId: effectiveDriverId,
      });

      let access: LocationAccess = "unknown";
      try {
        await startDriverLocationTracking(
          result.orderId,
          String(effectiveDriverId),
        );
        access = await refreshPermissionState();
      } catch (locationError) {
        access = await refreshPermissionState();
        devWarn("[driver-order] delivery started but location share did not", {
          locationError,
          access,
        });
      }

      if (
        Platform.OS !== "web" &&
        access !== "never" &&
        hasCoords &&
        order?.latitude != null &&
        order?.longitude != null
      ) {
        openGoogleMapsNavigation(order.latitude, order.longitude);
      }

      if (Platform.OS === "web") {
        showAlert(
          "Started",
          "Delivery is live. Keep this browser tab open to share your location. Use Navigate to open Google Maps.",
        );
      } else if (access === "never") {
        showAlert(
          "Started — location is off",
          'Delivery started, but location is set to Never so live location is not being sent. Tap "Enable location" and choose While Using or Always.',
        );
      } else {
        showAlert(
          "Started",
          "Delivery is live. Location is shared only while this app stays open, unless you allow Always.",
        );
      }
      refetch();
    } catch (e: unknown) {
      devError("[driver-order] startDelivery / location tracking failed", e);
      showAlert("Error", getDriverErrorMessage(e, "Could not start delivery"));
    }
  };

  const onMarkDelivered = async () => {
    const confirmed = await confirmAction(
      "Mark delivered",
      "Confirm that this order was delivered?",
      "Delivered",
    );
    if (!confirmed) return;

    try {
      await markDelivered({ id: orderMongoId }).unwrap();
      devLog("[driver-order] markDelivered OK — stopping Firebase location share", {
        orderMongoId,
      });
      await stopDriverLocationTracking();
      showAlert("Done", "Order marked as delivered");
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/driver/home");
      }
    } catch (e: unknown) {
      devError("[driver-order] markDelivered / stop location failed", e);
      showAlert("Error", getDriverErrorMessage(e, "Could not mark delivered"));
    }
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
          <LocationShareBanner
            locationAccess={locationAccess}
            isUpdatingPermission={isUpdatingPermission}
            onEnableLocation={onEnableLocation}
            onAllowAlways={onAllowAlways}
          />
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

function LocationShareBanner({
  locationAccess,
  isUpdatingPermission,
  onEnableLocation,
  onAllowAlways,
}: {
  locationAccess: LocationAccess;
  isUpdatingPermission: boolean;
  onEnableLocation: () => void;
  onAllowAlways: () => void;
}) {
  if (Platform.OS === "web") {
    return (
      <View style={styles.liveBanner}>
        <Ionicons name="radio-outline" size={18} color="#1D4ED8" />
        <Text style={styles.liveBannerText}>
          Live location is shared only while this browser tab stays open. Return here
          after using Google Maps.
        </Text>
      </View>
    );
  }

  if (locationAccess === "never") {
    return (
      <View style={[styles.liveBanner, styles.liveBannerError]}>
        <View style={styles.liveBannerBody}>
          <View style={styles.liveBannerTitleRow}>
            <Ionicons name="close-circle-outline" size={18} color="#B91C1C" />
            <Text style={[styles.liveBannerTitle, styles.liveBannerErrorTitle]}>
              Location is off (Never)
            </Text>
          </View>
          <Text style={styles.liveBannerErrorText}>
            Live location is not being sent to Firebase. Enable location and choose
            While Using or Always so customers can track this delivery.
          </Text>
          <TouchableOpacity
            style={styles.enableBtn}
            onPress={onEnableLocation}
            disabled={isUpdatingPermission}
            activeOpacity={0.85}
          >
            {isUpdatingPermission ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="settings-outline" size={18} color="#fff" />
                <Text style={styles.alwaysBtnText}>Enable location</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.liveBannerErrorHint}>
            If the prompt does not appear, open Settings → Location and turn it on.
          </Text>
        </View>
      </View>
    );
  }

  if (locationAccess === "always") {
    return (
      <View style={[styles.liveBanner, styles.liveBannerOk]}>
        <Ionicons name="checkmark-circle" size={18} color="#047857" />
        <Text style={[styles.liveBannerText, styles.liveBannerOkText]}>
          Location is sharing with Always access — it continues even if you open Maps
          or leave this app.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.liveBanner, styles.liveBannerWarn]}>
      <View style={styles.liveBannerBody}>
        <View style={styles.liveBannerTitleRow}>
          <Ionicons name="warning-outline" size={18} color="#B45309" />
          <Text style={styles.liveBannerTitle}>Location only while app is open</Text>
        </View>
        <Text style={styles.liveBannerWarnText}>
          Your live location is sent only while this driver app stays open. If you
          switch to Google Maps or another app, sharing stops until you come back.
        </Text>
        <TouchableOpacity
          style={styles.alwaysBtn}
          onPress={onAllowAlways}
          disabled={isUpdatingPermission}
          activeOpacity={0.85}
        >
          {isUpdatingPermission ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="navigate-circle-outline" size={18} color="#fff" />
              <Text style={styles.alwaysBtnText}>Allow Always</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.liveBannerHint}>
          Tip: choose Always so customers keep seeing your location during delivery.
        </Text>
      </View>
    </View>
  );
}

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
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  liveBannerWarn: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FCD34D",
  },
  liveBannerError: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  liveBannerOk: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  liveBannerBody: { flex: 1, gap: 8 },
  liveBannerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveBannerTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#92400E",
  },
  liveBannerErrorTitle: { color: "#991B1B" },
  liveBannerText: { flex: 1, fontSize: 12, fontWeight: "600", color: "#1D4ED8" },
  liveBannerWarnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
    lineHeight: 18,
  },
  liveBannerErrorText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#991B1B",
    lineHeight: 18,
  },
  liveBannerOkText: { color: "#047857" },
  liveBannerHint: {
    fontSize: 11,
    fontWeight: "500",
    color: "#A16207",
    lineHeight: 16,
  },
  liveBannerErrorHint: {
    fontSize: 11,
    fontWeight: "500",
    color: "#B91C1C",
    lineHeight: 16,
  },
  alwaysBtn: {
    marginTop: 2,
    backgroundColor: "#B45309",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
  },
  enableBtn: {
    marginTop: 2,
    backgroundColor: "#B91C1C",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
  },
  alwaysBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
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
