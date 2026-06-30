import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AdminScreen from "@/app/admin/components/AdminScreen";
import HeaderBar from "@/app/admin/components/HeaderBar";
import { adminTheme } from "@/app/admin/theme";
import {
  useGetAdminStoreConfigQuery,
  useUpdateAdminStoreConfigMutation,
} from "@/redux/features/adminStoreConfigSlice";

const AdminStoreSettingsScreen = () => {
  const { data, isLoading } = useGetAdminStoreConfigQuery();
  const [updateSettings, { isLoading: isSaving }] =
    useUpdateAdminStoreConfigMutation();

  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("21:00");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [radiusKm, setRadiusKm] = useState("5");
  const [centerLatitude, setCenterLatitude] = useState("28.713074");
  const [centerLongitude, setCenterLongitude] = useState("77.65419");
  const [acceptingOrders, setAcceptingOrders] = useState(true);

  useEffect(() => {
    if (!data?.storeConfig) return;
    setOpenTime(data.storeConfig.storeHours.openTime);
    setCloseTime(data.storeConfig.storeHours.closeTime);
    setTimezone(data.storeConfig.storeHours.timezone);
    setRadiusKm(String(data.storeConfig.deliveryRadius.radiusKm));
    setCenterLatitude(String(data.storeConfig.deliveryRadius.centerLatitude));
    setCenterLongitude(String(data.storeConfig.deliveryRadius.centerLongitude));
    setAcceptingOrders(data.storeConfig.acceptingOrders !== false);
  }, [data?.storeConfig]);

  const toggleAcceptingOrders = async (value: boolean) => {
    const previous = acceptingOrders;
    setAcceptingOrders(value);
    try {
      await updateSettings({ acceptingOrders: value }).unwrap();
    } catch (error: any) {
      setAcceptingOrders(previous);
      Alert.alert(
        "Could not update",
        error?.data?.error?.message ?? "Please try again.",
      );
    }
  };

  const onSubmit = async () => {
    const body = {
      acceptingOrders,
      storeHours: {
        openTime: openTime.trim(),
        closeTime: closeTime.trim(),
        timezone: timezone.trim() || "Asia/Kolkata",
      },
      deliveryRadius: {
        radiusKm: Number(radiusKm) || 5,
        centerLatitude: Number(centerLatitude),
        centerLongitude: Number(centerLongitude),
      },
    };

    try {
      await updateSettings(body).unwrap();
      Alert.alert("Saved", "Store settings updated.");
    } catch (error: any) {
      Alert.alert(
        "Could not save",
        error?.data?.error?.message ?? "Please check the values and try again.",
      );
    }
  };

  if (isLoading && !data) {
    return (
      <AdminScreen>
        <HeaderBar title="Store" subtitle="Hours & delivery area" />
        <ActivityIndicator style={{ marginTop: 40 }} />
      </AdminScreen>
    );
  }

  return (
    <AdminScreen>
      <HeaderBar title="Store" subtitle="Hours & delivery area" />
      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.sectionTitle}>Accepting orders</Text>
            <Text style={styles.help}>
              Turn off anytime to stop new checkouts, even during store hours.
            </Text>
          </View>
          <Switch
            value={acceptingOrders}
            onValueChange={toggleAcceptingOrders}
            trackColor={{ true: adminTheme.accent, false: "#ccc" }}
            disabled={isSaving}
          />
        </View>

        <Text style={styles.sectionTitle}>Order hours</Text>
        <Text style={styles.help}>
          Customers can checkout only between open and close time (24-hour
          format, store timezone).
        </Text>
        <Field label="Open time (HH:mm)" value={openTime} onChangeText={setOpenTime} />
        <Field label="Close time (HH:mm)" value={closeTime} onChangeText={setCloseTime} />
        <Field label="Timezone" value={timezone} onChangeText={setTimezone} />

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Delivery radius</Text>
        <Text style={styles.help}>
          Addresses outside this radius from the store center cannot place orders.
        </Text>
        <Field
          label="Radius (km)"
          value={radiusKm}
          onChangeText={setRadiusKm}
          keyboardType="numeric"
        />
        <Field
          label="Store center latitude"
          value={centerLatitude}
          onChangeText={setCenterLatitude}
          keyboardType="numeric"
        />
        <Field
          label="Store center longitude"
          value={centerLongitude}
          onChangeText={setCenterLongitude}
          keyboardType="numeric"
        />

        <View style={styles.preview}>
          <Text style={styles.previewTitle}>Preview</Text>
          <Text style={styles.previewText}>
            {acceptingOrders
              ? "Store is open for orders"
              : "Store is closed for orders (manual)"}
          </Text>
          <Text style={styles.previewText}>
            Orders accepted {openTime || "09:00"} – {closeTime || "21:00"} (
            {timezone || "Asia/Kolkata"})
          </Text>
          <Text style={styles.previewText}>
            Delivery within {Number(radiusKm) || 5} km of store center
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submit, isSaving && styles.submitDisabled]}
          onPress={onSubmit}
          disabled={isSaving}
        >
          <Text style={styles.submitText}>
            {isSaving ? "Saving…" : "Save settings"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </AdminScreen>
  );
};

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "numeric" | "default";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: 16, gap: 14, paddingBottom: 40 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: adminTheme.cardBg,
    borderWidth: 1,
    borderColor: adminTheme.border,
  },
  toggleCopy: { flex: 1, gap: 4 },
  sectionTitle: {
    fontFamily: "Raleway_700Bold",
    fontSize: 16,
    color: adminTheme.textPrimary,
  },
  help: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 13,
    lineHeight: 20,
    color: adminTheme.textSecondary,
  },
  field: { gap: 6 },
  label: {
    fontFamily: "Montserrat_600SemiBold",
    color: adminTheme.textPrimary,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: adminTheme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: adminTheme.cardBg,
    fontFamily: "Montserrat_500Medium",
  },
  preview: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    gap: 6,
  },
  previewTitle: {
    fontFamily: "Raleway_700Bold",
    fontSize: 14,
    color: adminTheme.textPrimary,
  },
  previewText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 13,
    color: adminTheme.textSecondary,
  },
  submit: {
    marginTop: 12,
    backgroundColor: adminTheme.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.6 },
  submitText: {
    color: "#fff",
    fontFamily: "Raleway_700Bold",
    fontSize: 15,
  },
});

export default AdminStoreSettingsScreen;
