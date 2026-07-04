import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import AdminScreen from "@/app/admin/components/AdminScreen";
import HeaderBar from "@/app/admin/components/HeaderBar";
import { adminTheme } from "@/app/admin/theme";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  useDeleteAdminOfferMutation,
  useListAdminOffersQuery,
  useUpdateAdminOfferMutation,
} from "@/redux/features/adminOfferSlice";
import { useGetAdminProductQuery } from "@/redux/features/adminProductSlice";
import {
  consumePendingProductSelection,
  type PendingProductSelection,
} from "./productSelection";
import { staticImage } from "@/app/(private)/(category)/CategoryList/utils";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "@/constants/Colors";
import { confirmAction, showAlert } from "@/utils/platformAlert";

const AdminOfferEditScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useListAdminOffersQuery();
  const [updateOffer, { isLoading: isSaving }] = useUpdateAdminOfferMutation();
  const [deleteOffer, { isLoading: isDeleting }] = useDeleteAdminOfferMutation();

  const offer = data?.offers?.find((o) => o.id === id);
  const freebieProductId = offer?.freebies?.[0]?.productId;
  const { data: productData } = useGetAdminProductQuery(
    { id: freebieProductId ?? "" },
    { skip: !freebieProductId || offer?.type !== "freebie" },
  );

  const [enabled, setEnabled] = useState(true);
  const [minOrderValue, setMinOrderValue] = useState("0");
  const [sortOrder, setSortOrder] = useState("0");
  const [promoPrice, setPromoPrice] = useState("0");
  const [label, setLabel] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<PendingProductSelection | null>(null);

  useEffect(() => {
    if (!offer) return;
    setEnabled(offer.enabled);
    setMinOrderValue(String(offer.minOrderValue));
    setSortOrder(String(offer.sortOrder));
    setPromoPrice(String(offer.freebies?.[0]?.promoPrice ?? 0));
    setLabel(offer.freebies?.[0]?.label ?? offer.discount?.label ?? "");
  }, [offer]);

  useEffect(() => {
    const p = productData?.product;
    if (!p || selectedProduct) return;
    setSelectedProduct({
      id: p._id,
      name: p.name,
      size: p.size,
      image: p.image,
    });
  }, [productData?.product, selectedProduct]);

  useFocusEffect(
    useCallback(() => {
      const picked = consumePendingProductSelection();
      if (picked) {
        setSelectedProduct(picked);
      }
    }, []),
  );

  const onSave = async () => {
    if (!offer) return;
    if (offer.type === "freebie" && !selectedProduct?.id) {
      showAlert("Choose product", "Select a promo / freebie product first.");
      return;
    }
    try {
      await updateOffer({
        id: offer.id,
        body: {
          enabled,
          minOrderValue: Number(minOrderValue) || 0,
          sortOrder: Number(sortOrder) || 0,
          ...(offer.type === "freebie"
            ? {
                freebies: [
                  {
                    productId: selectedProduct!.id,
                    quantity: offer.freebies?.[0]?.quantity ?? 1,
                    promoPrice: Number(promoPrice) || 0,
                    label: label.trim() || undefined,
                  },
                ],
              }
            : {}),
        },
      }).unwrap();
      router.back();
    } catch (error: any) {
      showAlert(
        "Update failed",
        error?.data?.error?.message ?? "Could not save offer.",
      );
    }
  };

  const onDelete = async () => {
    const confirmed = await confirmAction(
      "Delete offer",
      "This cannot be undone.",
      "Delete",
    );
    if (!confirmed) return;

    await deleteOffer(offer!.id);
    router.back();
  };

  if (isLoading || !offer) {
    return (
      <AdminScreen>
        <HeaderBar title="Edit Offer" />
        <ActivityIndicator style={{ marginTop: 40 }} />
      </AdminScreen>
    );
  }

  return (
    <AdminScreen>
      <HeaderBar title="Edit Offer" subtitle={offer.type} />
      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.row}>
          <Text style={styles.label}>Enabled</Text>
          <Switch value={enabled} onValueChange={setEnabled} />
        </View>
        <Field
          label="Minimum order (₹)"
          value={minOrderValue}
          onChangeText={setMinOrderValue}
        />
        <Field label="Sort order" value={sortOrder} onChangeText={setSortOrder} />
        {offer.type === "freebie" ? (
          <>
            <Text style={styles.label}>Freebie product</Text>
            {selectedProduct ? (
              <View style={styles.productCard}>
                <Image
                  source={{ uri: selectedProduct.image || staticImage }}
                  style={styles.productThumb}
                />
                <View style={styles.productBody}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {selectedProduct.name}
                  </Text>
                  <Text style={styles.productMeta}>{selectedProduct.size}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.hint}>No product selected</Text>
            )}
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={() => router.push("/admin/offers/select-product" as any)}
            >
              <Text style={styles.pickBtnText}>Change product</Text>
            </TouchableOpacity>
            <Field label="Promo price (₹)" value={promoPrice} onChangeText={setPromoPrice} />
            <Field label="Label" value={label} onChangeText={setLabel} />
          </>
        ) : null}

        <TouchableOpacity style={styles.submit} onPress={onSave} disabled={isSaving}>
          <Text style={styles.submitText}>{isSaving ? "Saving…" : "Save changes"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.delete, isDeleting && styles.deleteDisabled]}
          onPress={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color={Colors.light.gradientRed_1} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color={Colors.light.gradientRed_1} />
              <Text style={styles.deleteText}>Delete offer</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </AdminScreen>
  );
};

function Field({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: 16, gap: 14, paddingBottom: 48 },
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
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminTheme.border,
    backgroundColor: adminTheme.cardBg,
  },
  productThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  productBody: { flex: 1 },
  productName: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 14,
    color: adminTheme.textPrimary,
  },
  productMeta: {
    marginTop: 2,
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
    color: adminTheme.textSecondary,
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
  submitText: { color: "#fff", fontFamily: "Raleway_700Bold" },
  delete: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deleteDisabled: { opacity: 0.6 },
  deleteText: { color: Colors.light.gradientRed_1, fontFamily: "Montserrat_700Bold" },
});

export default AdminOfferEditScreen;
