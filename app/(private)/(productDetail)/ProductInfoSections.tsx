import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { ProductDetailResponse } from "@/types/global";
import FoodTypeBadge from "./FoodTypeBadge";

type InfoRowProps = {
  label: string;
  value: string | null | undefined;
};

const InfoRow = memo(({ label, value }: InfoRowProps) => {
  if (!value) return null;

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
});

InfoRow.displayName = "InfoRow";

const VegNonVegRow = memo(({ foodType }: { foodType?: string | null }) => {
  if (!foodType) return null;

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Veg / Non-Veg</Text>
      <FoodTypeBadge foodType={foodType} size="sm" showLabel />
    </View>
  );
});

VegNonVegRow.displayName = "VegNonVegRow";

type SectionProps = {
  title: string;
  children: React.ReactNode;
  hasContent: boolean;
};

const Section = memo(({ title, children, hasContent }: SectionProps) => {
  if (!hasContent) return null;

  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle} type="title">
        {title}
      </ThemedText>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
});

Section.displayName = "Section";

type ProductInfoSectionsProps = {
  productInformation?: ProductDetailResponse["productInformation"];
  itemSpecifications?: ProductDetailResponse["itemSpecifications"];
  size?: string | null;
  foodType?: string | null;
};

const ProductInfoSections = ({
  productInformation,
  itemSpecifications,
  size,
  foodType,
}: ProductInfoSectionsProps) => {
  const hasProductInformation = Boolean(
    productInformation?.brand ||
      productInformation?.countryOfOrigin ||
      productInformation?.articleId ||
      productInformation?.vegNonVeg
  );

  const hasItemSpecifications = Boolean(
    size ||
      itemSpecifications?.netQuantity ||
      itemSpecifications?.productType
  );

  if (!hasProductInformation && !hasItemSpecifications) {
    return null;
  }
  return (
    <View style={styles.container}>
      <Section title="Product Information" hasContent={hasProductInformation}>
        <InfoRow label="Brand" value={productInformation?.brand} />
        <InfoRow
          label="Country of Origin"
          value={productInformation?.countryOfOrigin}
        />
        <InfoRow label="Article ID" value={productInformation?.articleId} />
        <VegNonVegRow foodType={foodType || productInformation?.vegNonVeg} />
      </Section>

      <Section title="Item Specifications" hasContent={hasItemSpecifications}>
        <InfoRow label="Size" value={size || itemSpecifications?.netQuantity} />
        <InfoRow label="Product Type" value={itemSpecifications?.productType} />
      </Section>
    </View>
  );
};

export default memo(ProductInfoSections);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    marginTop: 8,
    gap: 20,
  },
  section: {
    backgroundColor: Colors.light.softGrey_2,
    borderRadius: 12,
    padding: 16,
    marginTop: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Montserrat_700Bold",
    color: Colors.light.defaultText,
    marginBottom: 12,
  },
  sectionBody: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.mediumGrey,
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.defaultText,
    textAlign: "right",
    textTransform: "capitalize",
  },
});
