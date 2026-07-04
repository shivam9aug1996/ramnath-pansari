import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AdminScreen from "@/app/admin/components/AdminScreen";
import HeaderBar from "@/app/admin/components/HeaderBar";
import { adminTheme } from "@/app/admin/theme";
import {
  useGetAdminDeliverySettingsQuery,
  useUpdateAdminDeliverySettingsMutation,
} from "@/redux/features/adminDeliverySettingsSlice";
import { showAlert } from "@/utils/platformAlert";

const AdminDeliverySettingsScreen = () => {
  const { data, isLoading } = useGetAdminDeliverySettingsQuery();
  const [updateSettings, { isLoading: isSaving }] =
    useUpdateAdminDeliverySettingsMutation();

  const [freeDeliveryMin, setFreeDeliveryMin] = useState("200");
  const [shippingFee, setShippingFee] = useState("50");

  useEffect(() => {
    if (!data?.deliverySettings) return;
    setFreeDeliveryMin(String(data.deliverySettings.freeDeliveryMin));
    setShippingFee(String(data.deliverySettings.shippingFee));
  }, [data?.deliverySettings]);

  const onSubmit = async () => {
    const body = {
      freeDeliveryMin: Number(freeDeliveryMin) || 0,
      shippingFee: Number(shippingFee) || 0,
    };

    try {
      await updateSettings(body).unwrap();
      showAlert("Saved", "Delivery settings updated.");
    } catch (error: any) {
      showAlert(
        "Could not save",
        error?.data?.error?.message ?? "Please check the values and try again.",
      );
    }
  };

  if (isLoading && !data) {
    return (
      <AdminScreen>
        <HeaderBar title="Delivery" subtitle="Shipping & free delivery" />
        <ActivityIndicator style={{ marginTop: 40 }} />
      </AdminScreen>
    );
  }

  return (
    <AdminScreen>
      <HeaderBar title="Delivery" subtitle="Shipping & free delivery" />
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.help}>
          Orders at or above the free delivery minimum pay no shipping fee.
          Below that, the shipping fee is added at checkout.
        </Text>

        <Field
          label="Free delivery minimum (₹)"
          value={freeDeliveryMin}
          onChangeText={setFreeDeliveryMin}
          keyboardType="numeric"
        />
        <Field
          label="Shipping fee (₹)"
          value={shippingFee}
          onChangeText={setShippingFee}
          keyboardType="numeric"
        />

        <View style={styles.preview}>
          <Text style={styles.previewTitle}>Preview</Text>
          <Text style={styles.previewText}>
            Cart ₹{Math.max(0, Number(freeDeliveryMin) - 1) || 0} → shipping ₹
            {Number(shippingFee) || 0}
          </Text>
          <Text style={styles.previewText}>
            Cart ₹{Number(freeDeliveryMin) || 0}+ → FREE delivery
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: 16, gap: 14, paddingBottom: 40 },
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
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
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

export default AdminDeliverySettingsScreen;
