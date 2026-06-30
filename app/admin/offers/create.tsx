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
import { useCreateAdminOfferMutation } from "@/redux/features/adminOfferSlice";
import { AdminOfferInput } from "@/types/global";
import {
  consumePendingProductSelection,
  type PendingProductSelection,
} from "./productSelection";
import { staticImage } from "@/app/(private)/(category)/CategoryList/utils";

const AdminOfferCreateScreen = () => {
  const router = useRouter();
  const [createOffer, { isLoading }] = useCreateAdminOfferMutation();

  const [type, setType] = useState<"freebie" | "discount">("freebie");
  const [minOrderValue, setMinOrderValue] = useState("1000");
  const [sortOrder, setSortOrder] = useState("1");
  const [enabled, setEnabled] = useState(true);
  const [selectedProduct, setSelectedProduct] =
    useState<PendingProductSelection | null>(null);
  const [promoPrice, setPromoPrice] = useState("0");
  const [label, setLabel] = useState("");
  const [discountKind, setDiscountKind] = useState<"flat" | "percent">("percent");
  const [discountValue, setDiscountValue] = useState("5");

  useFocusEffect(
    useCallback(() => {
      const picked = consumePendingProductSelection();
      if (picked) {
        setSelectedProduct(picked);
        if (!label.trim()) {
          setLabel(picked.name);
        }
      }
    }, [label]),
  );

  const onSubmit = async () => {
    const body: AdminOfferInput = {
      enabled,
      type,
      minOrderValue: Number(minOrderValue) || 0,
      sortOrder: Number(sortOrder) || 0,
    };

    if (type === "freebie") {
      if (!selectedProduct?.id) {
        Alert.alert("Choose product", "Select a promo / freebie product first.");
        return;
      }
      body.freebies = [
        {
          productId: selectedProduct.id,
          quantity: 1,
          promoPrice: Number(promoPrice) || 0,
          label: label.trim() || undefined,
        },
      ];
    } else {
      body.discount = {
        kind: discountKind,
        value: Number(discountValue) || 0,
        label:
          discountKind === "percent"
            ? `${discountValue}% off`
            : `₹${discountValue} off`,
      };
    }

    try {
      await createOffer(body).unwrap();
      router.back();
    } catch (error: any) {
      Alert.alert(
        "Could not create offer",
        error?.data?.error?.message ?? "Please check the form and try again.",
      );
    }
  };

  return (
    <AdminScreen>
      <HeaderBar title="New Offer" subtitle="Create promotion" />
      <ScrollView contentContainerStyle={styles.form}>
        <Row label="Enabled">
          <Switch value={enabled} onValueChange={setEnabled} />
        </Row>

        <Row label="Type">
          <View style={styles.rowButtons}>
            {(["freebie", "discount"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, type === t && styles.chipActive]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.chipText, type === t && styles.chipTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Row>

        <Field
          label="Minimum order (₹)"
          value={minOrderValue}
          onChangeText={setMinOrderValue}
          keyboardType="numeric"
        />
        <Field
          label="Sort order"
          value={sortOrder}
          onChangeText={setSortOrder}
          keyboardType="numeric"
        />

        {type === "freebie" ? (
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
              <Text style={styles.pickBtnText}>
                {selectedProduct ? "Change product" : "Choose product"}
              </Text>
            </TouchableOpacity>
            <Field
              label="Promo price (₹)"
              value={promoPrice}
              onChangeText={setPromoPrice}
              keyboardType="numeric"
            />
            <Field label="Label" value={label} onChangeText={setLabel} />
          </>
        ) : (
          <>
            <Row label="Discount kind">
              <View style={styles.rowButtons}>
                {(["percent", "flat"] as const).map((k) => (
                  <TouchableOpacity
                    key={k}
                    style={[styles.chip, discountKind === k && styles.chipActive]}
                    onPress={() => setDiscountKind(k)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        discountKind === k && styles.chipTextActive,
                      ]}
                    >
                      {k}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Row>
            <Field
              label="Discount value"
              value={discountValue}
              onChangeText={setDiscountValue}
              keyboardType="numeric"
            />
          </>
        )}

        <TouchableOpacity
          style={[styles.submit, isLoading && styles.submitDisabled]}
          onPress={onSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitText}>
            {isLoading ? "Saving…" : "Create offer"}
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
  rowButtons: { flexDirection: "row", gap: 8 },
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
    textTransform: "capitalize",
    color: adminTheme.textPrimary,
  },
  chipTextActive: {
    color: "#fff",
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

export default AdminOfferCreateScreen;
