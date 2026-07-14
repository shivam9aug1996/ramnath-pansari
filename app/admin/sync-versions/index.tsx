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
  useFlushProductRedisCacheMutation,
  useGetAdminSyncVersionsQuery,
  useUpdateAdminSyncVersionsMutation,
} from "@/redux/features/adminSyncVersionsSlice";
import type { AppSyncServerVersions } from "@/types/global";
import { confirmAction, showAlert } from "@/utils/platformAlert";

const VERSION_FIELDS: {
  key: keyof AppSyncServerVersions;
  label: string;
  help: string;
}[] = [
  {
    key: "carousel",
    label: "Carousel",
    help: "Home banner slides",
  },
  {
    key: "offers",
    label: "Offers",
    help: "Promos & milestones",
  },
  {
    key: "deliverySettings",
    label: "Delivery settings",
    help: "Shipping & free delivery",
  },
  {
    key: "storeConfig",
    label: "Store config",
    help: "Hours & delivery radius",
  },
  {
    key: "category",
    label: "Categories",
    help: "Store taxonomy",
  },
  {
    key: "product",
    label: "Products",
    help: "Catalog cache on clients",
  },
];

const emptyForm = (): Record<keyof AppSyncServerVersions, string> => ({
  carousel: "1",
  offers: "1",
  deliverySettings: "1",
  storeConfig: "1",
  category: "1",
  product: "1",
});

const AdminSyncVersionsScreen = () => {
  const { data, isLoading } = useGetAdminSyncVersionsQuery();
  const [updateVersions, { isLoading: isSaving }] =
    useUpdateAdminSyncVersionsMutation();
  const [flushProductRedis, { isLoading: isFlushing }] =
    useFlushProductRedisCacheMutation();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!data?.syncVersions) return;
    setForm({
      carousel: String(data.syncVersions.carousel),
      offers: String(data.syncVersions.offers),
      deliverySettings: String(data.syncVersions.deliverySettings),
      storeConfig: String(data.syncVersions.storeConfig),
      category: String(data.syncVersions.category),
      product: String(data.syncVersions.product),
    });
  }, [data?.syncVersions]);

  const setField = (key: keyof AppSyncServerVersions, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value.replace(/[^\d]/g, "") }));
  };

  const bumpField = (key: keyof AppSyncServerVersions) => {
    setForm((prev) => {
      const current = Number(prev[key]) || 0;
      return { ...prev, [key]: String(current + 1) };
    });
  };

  const onSubmit = async () => {
    const body: Partial<AppSyncServerVersions> = {};
    for (const { key } of VERSION_FIELDS) {
      const value = Number(form[key]);
      if (!Number.isInteger(value) || value < 1) {
        showAlert("Invalid value", `${key} must be an integer >= 1.`);
        return;
      }
      body[key] = value;
    }

    try {
      await updateVersions(body).unwrap();
      showAlert(
        "Saved",
        "Clients with older versions will refetch on next sync.",
      );
    } catch (error: any) {
      showAlert(
        "Could not save",
        error?.data?.error?.message ?? "Please try again.",
      );
    }
  };

  const onFlushProductRedis = async () => {
    const confirmed = await confirmAction(
      "Flush product Redis?",
      "Deletes only products:* list cache keys. Checkout holds and Vertex prices are left alone.",
      "Flush",
    );
    if (!confirmed) return;

    try {
      const result = await flushProductRedis().unwrap();
      showAlert(
        "Redis flushed",
        `Deleted ${result.deleted} key${result.deleted === 1 ? "" : "s"} matching products:*.`,
      );
    } catch (error: any) {
      showAlert(
        "Could not flush",
        error?.data?.error?.message ?? "Please try again.",
      );
    }
  };

  if (isLoading && !data) {
    return (
      <AdminScreen>
        <HeaderBar title="Sync versions" subtitle="Force client refreshes" />
        <ActivityIndicator style={{ marginTop: 40 }} />
      </AdminScreen>
    );
  }

  return (
    <AdminScreen>
      <HeaderBar title="Sync versions" subtitle="Force client refreshes" />
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.help}>
          Raise a version when clients should discard cached data and refetch.
          Setting a value higher than a phone’s stored version marks that
          resource stale on the next app sync.
        </Text>

        {VERSION_FIELDS.map(({ key, label, help }) => (
          <View key={key} style={styles.row}>
            <View style={styles.rowCopy}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.rowHelp}>{help}</Text>
            </View>
            <View style={styles.rowControls}>
              <TextInput
                style={styles.input}
                value={form[key]}
                onChangeText={(v) => setField(key, v)}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={styles.bump}
                onPress={() => bumpField(key)}
                hitSlop={8}
              >
                <Text style={styles.bumpText}>+1</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.submit, isSaving && styles.submitDisabled]}
          onPress={onSubmit}
          disabled={isSaving || isFlushing}
        >
          <Text style={styles.submitText}>
            {isSaving ? "Saving…" : "Save versions"}
          </Text>
        </TouchableOpacity>

        <View style={styles.redisCard}>
          <Text style={styles.label}>Product Redis cache</Text>
          <Text style={styles.rowHelp}>
            Clears server list cache keys matching products:* only. Does not
            bump client sync versions or touch checkout/Vertex keys.
          </Text>
          <TouchableOpacity
            style={[styles.secondaryBtn, isFlushing && styles.submitDisabled]}
            onPress={onFlushProductRedis}
            disabled={isFlushing || isSaving}
          >
            <Text style={styles.secondaryBtnText}>
              {isFlushing ? "Flushing…" : "Flush products:* Redis"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AdminScreen>
  );
};

const styles = StyleSheet.create({
  form: { padding: 16, gap: 12, paddingBottom: 40 },
  help: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 13,
    lineHeight: 20,
    color: adminTheme.textSecondary,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: adminTheme.cardBg,
    borderWidth: 1,
    borderColor: adminTheme.border,
  },
  rowCopy: { flex: 1, gap: 2 },
  label: {
    fontFamily: "Raleway_700Bold",
    fontSize: 15,
    color: adminTheme.textPrimary,
  },
  rowHelp: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
    color: adminTheme.textSecondary,
  },
  rowControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    width: 72,
    borderWidth: 1,
    borderColor: adminTheme.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    fontFamily: "Montserrat_600SemiBold",
    textAlign: "center",
    fontSize: 15,
  },
  bump: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
  },
  bumpText: {
    fontFamily: "Raleway_700Bold",
    fontSize: 13,
    color: "#4338CA",
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
  redisCard: {
    marginTop: 8,
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: adminTheme.cardBg,
    borderWidth: 1,
    borderColor: adminTheme.border,
  },
  secondaryBtn: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  secondaryBtnText: {
    color: "#92400E",
    fontFamily: "Raleway_700Bold",
    fontSize: 14,
  },
});

export default AdminSyncVersionsScreen;
