import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  useDeleteAdminCarouselMutation,
  useListAdminCarouselQuery,
  useUpdateAdminCarouselMutation,
} from "@/redux/features/adminCarouselSlice";
import { CarouselActionType } from "@/types/global";
import { consumePendingCategorySelection } from "@/app/admin/products/categorySelection";
import { staticImage } from "@/app/(private)/(category)/CategoryList/utils";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "@/constants/Colors";
import { confirmAction, showAlert } from "@/utils/platformAlert";

const ACTION_OPTIONS: { value: CarouselActionType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "scroll_categories", label: "Scroll to categories" },
  { value: "category", label: "Open category" },
];

const AdminCarouselEditScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useListAdminCarouselQuery();
  const [updateBanner, { isLoading: isSaving }] = useUpdateAdminCarouselMutation();
  const [deleteBanner, { isLoading: isDeleting }] = useDeleteAdminCarouselMutation();

  const banner = data?.banners?.find((item) => item.id === id);

  const [enabled, setEnabled] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [actionType, setActionType] =
    useState<CarouselActionType>("scroll_categories");
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [blurhash, setBlurhash] = useState<string | undefined>();

  useEffect(() => {
    if (!banner) return;
    setEnabled(banner.enabled);
    setSortOrder(String(banner.sortOrder));
    setImageUrl(banner.imageUrl);
    setBlurhash(banner.blurhash);
    setActionType(banner.actionType);
    if (banner.categoryId) {
      setSelectedCategory({
        id: banner.categoryId,
        label: banner.categoryName ?? banner.categoryId,
      });
    }
  }, [banner]);

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
    if (!banner) return;

    const body: {
      enabled: boolean;
      sortOrder: number;
      imageUrl: string;
      actionType: CarouselActionType;
      categoryId?: string;
      categoryName?: string;
    } = {
      enabled,
      sortOrder: Number(sortOrder) || 0,
      imageUrl: imageUrl.trim(),
      actionType,
    };

    if (actionType === "category") {
      if (!selectedCategory?.id) {
        showAlert("Choose category", "Select a category for this banner.");
        return;
      }
      body.categoryId = selectedCategory.id;
      body.categoryName = selectedCategory.label;
    }

    try {
      await updateBanner({ id: banner.id, body }).unwrap();
      router.back();
    } catch (error: any) {
      showAlert(
        "Could not save banner",
        error?.data?.error?.message ?? "Please check the form and try again.",
      );
    }
  };

  const confirmDelete = async () => {
    if (!banner) return;

    const confirmed = await confirmAction(
      "Delete banner",
      "Remove this carousel banner? This cannot be undone.",
      "Delete",
    );
    if (!confirmed) return;

    try {
      await deleteBanner(banner.id).unwrap();
      router.back();
    } catch (error: any) {
      showAlert(
        "Could not delete",
        error?.data?.error?.message ?? "Please try again.",
      );
    }
  };

  if (isLoading && !banner) {
    return (
      <AdminScreen>
        <HeaderBar title="Edit banner" subtitle="Home carousel slide" />
        <ActivityIndicator style={{ marginTop: 40 }} />
      </AdminScreen>
    );
  }

  if (!banner) {
    return (
      <AdminScreen>
        <HeaderBar title="Edit banner" subtitle="Home carousel slide" />
        <Text style={styles.missing}>Banner not found</Text>
      </AdminScreen>
    );
  }

  return (
    <AdminScreen>
      <HeaderBar
        title="Edit banner"
        subtitle="Home carousel slide"
        right={
          <TouchableOpacity
            onPress={confirmDelete}
            disabled={isDeleting}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={22} color={Colors.light.gradientRed_1} />
          </TouchableOpacity>
        }
      />
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

        {blurhash ? (
          <View style={styles.field}>
            <Text style={styles.label}>Blur placeholder</Text>
            <Text style={styles.readOnlyValue} selectable>
              {blurhash}
            </Text>
            <Text style={styles.hint}>
              Generated automatically when the banner is saved.
            </Text>
          </View>
        ) : (
          <Text style={styles.hint}>
            Blur placeholder will be generated when you save.
          </Text>
        )}

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
          style={[styles.submit, isSaving && styles.submitDisabled]}
          onPress={onSubmit}
          disabled={isSaving}
        >
          <Text style={styles.submitText}>
            {isSaving ? "Saving…" : "Save changes"}
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
  missing: {
    marginTop: 40,
    textAlign: "center",
    fontFamily: "Montserrat_500Medium",
    color: adminTheme.textSecondary,
  },
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
  readOnlyValue: {
    borderWidth: 1,
    borderColor: adminTheme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    fontFamily: "Montserrat_500Medium",
    fontSize: 11,
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

export default AdminCarouselEditScreen;
