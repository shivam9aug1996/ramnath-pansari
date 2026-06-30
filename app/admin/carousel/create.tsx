import React, { useCallback, useState } from "react";
import {
  Alert,
  Image,
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
import { useFocusEffect, useRouter } from "expo-router";
import { useCreateAdminCarouselMutation } from "@/redux/features/adminCarouselSlice";
import { AdminCarouselInput, CarouselActionType } from "@/types/global";
import { consumePendingCategorySelection } from "@/app/admin/products/categorySelection";
import { staticImage } from "@/app/(private)/(category)/CategoryList/utils";

const ACTION_OPTIONS: { value: CarouselActionType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "scroll_categories", label: "Scroll to categories" },
  { value: "category", label: "Open category" },
];

const AdminCarouselCreateScreen = () => {
  const router = useRouter();
  const [createBanner, { isLoading }] = useCreateAdminCarouselMutation();

  const [enabled, setEnabled] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [actionType, setActionType] =
    useState<CarouselActionType>("scroll_categories");
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    label: string;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      const picked = consumePendingCategorySelection();
      if (picked) {
        setSelectedCategory(picked);
        setActionType("category");
      }
    }, []),
  );

  const onSubmit = async () => {
    const body: AdminCarouselInput = {
      enabled,
      sortOrder: Number(sortOrder) || 0,
      imageUrl: imageUrl.trim(),
      actionType,
    };

    if (actionType === "category") {
      if (!selectedCategory?.id) {
        Alert.alert("Choose category", "Select a category for this banner.");
        return;
      }
      body.categoryId = selectedCategory.id;
      body.categoryName = selectedCategory.label;
    }

    try {
      await createBanner(body).unwrap();
      router.back();
    } catch (error: any) {
      Alert.alert(
        "Could not create banner",
        error?.data?.error?.message ?? "Please check the form and try again.",
      );
    }
  };

  return (
    <AdminScreen>
      <HeaderBar title="New banner" subtitle="Home carousel slide" />
      <ScrollView contentContainerStyle={styles.form}>
        <Row label="Enabled">
          <Switch value={enabled} onValueChange={setEnabled} />
        </Row>

        <Field
          label="Image URL"
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="https://..."
        />

        {imageUrl.trim() ? (
          <Image
            source={{ uri: imageUrl.trim() }}
            style={styles.preview}
            defaultSource={{ uri: staticImage }}
          />
        ) : null}

        <Text style={styles.hint}>
          A blur loading placeholder is generated automatically when you save.
        </Text>

        <Field
          label="Sort order"
          value={sortOrder}
          onChangeText={setSortOrder}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Tap action</Text>
        <View style={styles.rowButtons}>
          {ACTION_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.chip,
                actionType === option.value && styles.chipActive,
              ]}
              onPress={() => setActionType(option.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  actionType === option.value && styles.chipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {actionType === "category" ? (
          <>
            {selectedCategory ? (
              <Text style={styles.hint}>Category: {selectedCategory.label}</Text>
            ) : (
              <Text style={styles.hint}>No category selected</Text>
            )}
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={() =>
                router.push({
                  pathname: "/admin/products/select-category",
                  params: selectedCategory?.id
                    ? { currentCategoryId: selectedCategory.id }
                    : undefined,
                } as any)
              }
            >
              <Text style={styles.pickBtnText}>
                {selectedCategory ? "Change category" : "Choose category"}
              </Text>
            </TouchableOpacity>
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.submit, isLoading && styles.submitDisabled]}
          onPress={onSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitText}>
            {isLoading ? "Saving…" : "Create banner"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </AdminScreen>
  );
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "numeric" | "default";
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: 16, gap: 14, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  field: { gap: 6 },
  label: {
    fontFamily: "Montserrat_600SemiBold",
    color: adminTheme.textPrimary,
    fontSize: 13,
  },
  hint: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
    color: adminTheme.textSecondary,
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
    width: "100%",
    height: 120,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  rowButtons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  chipActive: { backgroundColor: adminTheme.accent },
  chipText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 12,
    color: adminTheme.textPrimary,
  },
  chipTextActive: {
    color: "#fff",
  },
  pickBtn: {
    borderWidth: 1,
    borderColor: adminTheme.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F0FDF4",
  },
  pickBtnText: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 13,
    color: adminTheme.accent,
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

export default AdminCarouselCreateScreen;
