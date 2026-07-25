import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  useGetAdminHomePromoQuery,
  useUpdateAdminHomePromoMutation,
} from "@/redux/features/adminHomePromoSlice";
import { showAlert } from "@/utils/platformAlert";

const AdminHomePromoScreen = () => {
  const { data, isLoading } = useGetAdminHomePromoQuery();
  const [updatePromo, { isLoading: isSaving }] =
    useUpdateAdminHomePromoMutation();

  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState("Today's pick");
  const [ctaLabel, setCtaLabel] = useState("View product");
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  useEffect(() => {
    const promo = data?.promo;
    if (!promo) return;
    setEnabled(Boolean(promo.enabled));
    setTitle(promo.title || "Today's pick");
    setCtaLabel(promo.ctaLabel || "View product");
    setProductId(promo.productId || "");
    setProductName(promo.productName || "");
    setVideoUrl(promo.videoUrl || "");
    setPosterUrl(promo.posterUrl || "");
    setStartsAt(promo.startsAt || "");
    setEndsAt(promo.endsAt || "");
  }, [data?.promo]);

  const onSubmit = async () => {
    if (enabled && !videoUrl.trim() && !posterUrl.trim()) {
      showAlert(
        "Missing media",
        "Add a video URL or poster image URL before enabling.",
      );
      return;
    }

    try {
      await updatePromo({
        enabled,
        title: title.trim(),
        ctaLabel: ctaLabel.trim() || "View product",
        productId: productId.trim(),
        productName: productName.trim(),
        videoUrl: videoUrl.trim(),
        posterUrl: posterUrl.trim(),
        startsAt: startsAt.trim() || null,
        endsAt: endsAt.trim() || null,
      }).unwrap();
      showAlert("Saved", "Home product promo updated.");
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
        <HeaderBar title="Home promo" subtitle="Product video ad on home" />
        <ActivityIndicator style={{ marginTop: 40 }} />
      </AdminScreen>
    );
  }

  return (
    <AdminScreen>
      <HeaderBar title="Home promo" subtitle="Product video ad on home" />
      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.sectionTitle}>Show on home</Text>
            <Text style={styles.help}>
              Small muted video bubble on the customer home screen. Tap opens
              full-screen with a product CTA.
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ true: adminTheme.accent, false: "#ccc" }}
          />
        </View>

        <Text style={styles.sectionTitle}>Content</Text>
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field
          label="CTA label"
          value={ctaLabel}
          onChangeText={setCtaLabel}
          placeholder="View product"
        />
        <Field
          label="Product ID"
          value={productId}
          onChangeText={setProductId}
          placeholder="Mongo product _id"
          autoCapitalize="none"
        />
        <Field
          label="Product name (optional)"
          value={productName}
          onChangeText={setProductName}
        />

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Media</Text>
        <Text style={styles.help}>
          Prefer a short compressed MP4 (5–15s). Poster is used while loading or
          if video is empty. Home bubble always autoplays muted (OS rule) even
          if the file has sound — user can unmute in full-screen controls.
        </Text>
        <Field
          label="Video URL"
          value={videoUrl}
          onChangeText={setVideoUrl}
          placeholder="https://…/promo.mp4"
          autoCapitalize="none"
          multiline
        />
        <Field
          label="Poster image URL"
          value={posterUrl}
          onChangeText={setPosterUrl}
          placeholder="https://…/poster.jpg"
          autoCapitalize="none"
          multiline
        />

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Schedule (optional)</Text>
        <Text style={styles.help}>
          ISO dates, e.g. 2026-07-24T00:00:00.000Z. Leave blank for always on
          while enabled.
        </Text>
        <Field
          label="Starts at"
          value={startsAt}
          onChangeText={setStartsAt}
          placeholder="ISO datetime or blank"
          autoCapitalize="none"
        />
        <Field
          label="Ends at"
          value={endsAt}
          onChangeText={setEndsAt}
          placeholder="ISO datetime or blank"
          autoCapitalize="none"
        />

        <View style={styles.preview}>
          <Text style={styles.previewTitle}>Preview</Text>
          <Text style={styles.previewText}>
            {enabled
              ? videoUrl.trim() || posterUrl.trim()
                ? "Promo will show on home for customers."
                : "Enabled but missing media — will not show."
              : "Promo is off."}
          </Text>
          {!!productId.trim() && (
            <Text style={styles.previewText}>
              CTA opens product {productId.trim()}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submit, isSaving && styles.submitDisabled]}
          onPress={onSubmit}
          disabled={isSaving}
        >
          <Text style={styles.submitText}>
            {isSaving ? "Saving…" : "Save promo"}
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
  placeholder,
  autoCapitalize,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences";
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        autoCapitalize={autoCapitalize ?? "sentences"}
        autoCorrect={false}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: 16, gap: 14, paddingBottom: 40 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: 15,
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
    color: adminTheme.textPrimary,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: "top",
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

export default AdminHomePromoScreen;
