import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  useResendDeliveryOtpMutation,
  useStartDriverDeliveryMutation,
} from "@/redux/features/driverOrderSlice";
import { openGoogleMapsNavigation } from "@/utils/driverMaps";
import {
  getDriverLocationPermissionState,
  requestAlwaysDriverLocationPermission,
  requestForegroundDriverLocationPermission,
  startDriverLocationTracking,
  stopDriverLocationTracking,
  stopDriverLocationTrackingIfOrder,
} from "@/utils/driverLocationTask";
import { getDriverErrorMessage } from "@/utils/driverDebug";
import { showAlert } from "@/utils/platformAlert";
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
  const [resendOtp, { isLoading: isResendingOtp }] = useResendDeliveryOtpMutation();
  const [locationAccess, setLocationAccess] = useState<LocationAccess>("unknown");
  const [isUpdatingPermission, setIsUpdatingPermission] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");

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

  // Admin cancel/deliver (or any non-OFD) → drop iOS location arrow for this order.
  useEffect(() => {
    if (!order?.orderId) return;
    if (isActiveDelivery) return;
    stopDriverLocationTrackingIfOrder(order.orderId)
      .then((stopped) => {
        if (stopped) {
          devLog("[driver-order] stopped location — order no longer out_for_delivery", {
            orderId: order.orderId,
            orderStatus: order.orderStatus,
          });
        }
      })
      .catch((error) => {
        devWarn("[driver-order] failed to stop location after status change", error);
      });
  }, [isActiveDelivery, order?.orderId, order?.orderStatus]);

  // While live, poll so admin cancel/deliver clears GPS without leaving the screen.
  useEffect(() => {
    if (!isActiveDelivery) return;
    const timer = setInterval(() => {
      refetch();
    }, 20_000);
    return () => clearInterval(timer);
  }, [isActiveDelivery, refetch]);

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
        // Pick up admin cancel/deliver while this screen was backgrounded.
        refetch();
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
    refetch,
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

  const openDeliverOtpModal = () => {
    setOtpInput("");
    setOtpError("");
    setOtpModalVisible(true);
  };

  const closeDeliverOtpModal = () => {
    if (isDelivering) return;
    setOtpModalVisible(false);
    setOtpInput("");
    setOtpError("");
  };

  const onConfirmDeliverWithOtp = async () => {
    const otp = otpInput.trim();
    if (!/^\d{4}$/.test(otp)) {
      setOtpError("Enter the 4-digit OTP from the customer");
      return;
    }

    try {
      setOtpError("");
      await markDelivered({ id: orderMongoId, otp }).unwrap();
      setOtpModalVisible(false);
      setOtpInput("");
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
      const message = getDriverErrorMessage(e, "Could not mark delivered");
      // Wrong OTP is expected user input — keep it in the modal, not a red console blast.
      if (message.toLowerCase().includes("otp")) {
        devLog("[driver-order] markDelivered rejected", e);
      } else {
        devError("[driver-order] markDelivered / stop location failed", e);
      }
      setOtpError(message);
    }
  };

  const onResendOtp = async () => {
    try {
      await resendOtp({ id: orderMongoId }).unwrap();
      showAlert("Sent", "Delivery OTP sent to the customer again");
    } catch (e: unknown) {
      showAlert("Error", getDriverErrorMessage(e, "Could not resend OTP"));
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
            <>
              <PrimaryButton
                label="Mark delivered"
                loading={isDelivering}
                onPress={openDeliverOtpModal}
                color="#1D4ED8"
              />
              <TouchableOpacity
                style={styles.resendBtn}
                onPress={onResendOtp}
                disabled={isResendingOtp}
                activeOpacity={0.85}
              >
                {isResendingOtp ? (
                  <ActivityIndicator color={Colors.light.darkGreen} />
                ) : (
                  <Text style={styles.resendBtnText}>Resend OTP to customer</Text>
                )}
              </TouchableOpacity>
            </>
          ) : null}

          {!canStart && !canDeliver ? (
            <Text style={styles.hint}>
              This order cannot be updated from the driver app right now.
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={otpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDeliverOtpModal}
      >
        <KeyboardAvoidingView
          style={styles.otpKeyboardRoot}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <Pressable
            style={styles.otpOverlay}
            onPress={() => {
              Keyboard.dismiss();
              closeDeliverOtpModal();
            }}
          >
            <Pressable style={styles.otpCard} onPress={() => {}}>
              <Text style={styles.otpTitle}>Enter delivery OTP</Text>
              <Text style={styles.otpSubtitle}>
                Ask the customer for the 4-digit code from their app or
                notification.
              </Text>
              <TextInput
                value={otpInput}
                onChangeText={(text) => {
                  setOtpInput(text.replace(/\D/g, "").slice(0, 4));
                  if (otpError) setOtpError("");
                }}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="••••"
                placeholderTextColor="#94A3B8"
                style={styles.otpInput}
                autoFocus
              />
              {otpError ? <Text style={styles.otpError}>{otpError}</Text> : null}
              <View style={styles.otpActions}>
                <TouchableOpacity
                  style={styles.otpCancelBtn}
                  onPress={closeDeliverOtpModal}
                  disabled={isDelivering}
                >
                  <Text style={styles.otpCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.otpConfirmBtn, isDelivering && { opacity: 0.7 }]}
                  onPress={onConfirmDeliverWithOtp}
                  disabled={isDelivering}
                >
                  {isDelivering ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.otpConfirmText}>Confirm delivered</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
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
  resendBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: adminTheme.border,
    minHeight: 48,
  },
  resendBtnText: {
    color: Colors.light.darkGreen,
    fontSize: 14,
    fontWeight: "800",
  },
  hint: { textAlign: "center", color: adminTheme.textSecondary, fontSize: 13 },
  otpKeyboardRoot: {
    flex: 1,
  },
  otpOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  otpCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    gap: 10,
    marginBottom: Platform.OS === "ios" ? 8 : 0,
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: adminTheme.textPrimary,
  },
  otpSubtitle: {
    fontSize: 13,
    color: adminTheme.textSecondary,
    lineHeight: 18,
  },
  otpInput: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: adminTheme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 10,
    textAlign: "center",
    color: adminTheme.textPrimary,
  },
  otpError: {
    fontSize: 13,
    color: "#B91C1C",
    fontWeight: "600",
  },
  otpActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  otpCancelBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  otpCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: adminTheme.textSecondary,
  },
  otpConfirmBtn: {
    flex: 1.4,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#1D4ED8",
    minHeight: 48,
    justifyContent: "center",
  },
  otpConfirmText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
});
