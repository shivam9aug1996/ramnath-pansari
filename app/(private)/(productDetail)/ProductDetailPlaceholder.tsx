import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import {
  FOOD_BADGE_SIZE_MD,
  PRODUCT_NAME_MIN_HEIGHT,
  productDetailContentStyles,
} from "./productDetailLayout";

const contentStyles = productDetailContentStyles;

const SkeletonBar = ({
  height = 13,
  width,
  flex,
  style,
}: {
  height?: number;
  width?: number | `${number}%`;
  flex?: number;
  style?: ViewStyle;
}) => (
  <View
    style={[
      skeletonStyles.bar,
      { height },
      width != null && { width },
      flex != null && { flex },
      style,
    ]}
  />
);

const InfoSectionSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <View style={contentStyles.infoSection}>
    <SkeletonBar width="55%" height={16} style={skeletonStyles.sectionTitle} />
    <View style={contentStyles.infoSectionBody}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={skeletonStyles.infoRow}>
          <SkeletonBar width="38%" height={14} />
          <SkeletonBar width="32%" height={14} />
        </View>
      ))}
    </View>
  </View>
);

export const ProductDetailBodySkeleton = () => (
  <>
    <View style={contentStyles.textContainer}>
      <View style={contentStyles.titleRow}>
        <View
          style={[
            skeletonStyles.badgeSkeleton,
            { width: FOOD_BADGE_SIZE_MD, height: FOOD_BADGE_SIZE_MD },
          ]}
        />
        <View style={[skeletonStyles.nameSkeleton, { minHeight: PRODUCT_NAME_MIN_HEIGHT }]}>
          <SkeletonBar width="95%" height={20} />
          <SkeletonBar width="72%" height={20} />
        </View>
      </View>

      <SkeletonBar width="28%" height={14} style={skeletonStyles.sizeBar} />
      <SkeletonBar width={72} height={24} style={skeletonStyles.discountBar} />
      <SkeletonBar width="46%" height={16} style={skeletonStyles.mrpBar} />
      <SkeletonBar width="38%" height={18} style={skeletonStyles.priceBar} />
    </View>

    <View style={contentStyles.infoSectionsContainer}>
      <InfoSectionSkeleton rows={4} />
      <InfoSectionSkeleton rows={2} />
    </View>
  </>
);

const ProductDetailPlaceholder = () => <ProductDetailBodySkeleton />;

export default ProductDetailPlaceholder;

const skeletonStyles = StyleSheet.create({
  bar: {
    borderRadius: 5,
    backgroundColor: "#f3f3f3",
  },
  badgeSkeleton: {
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#e3e3e3",
    backgroundColor: "#f3f3f3",
  },
  nameSkeleton: {
    flex: 1,
    gap: 6,
    justifyContent: "center",
  },
  sizeBar: {
    marginBottom: 8,
  },
  discountBar: {
    marginVertical: 5,
    borderRadius: 4,
  },
  mrpBar: {
    marginTop: 5,
  },
  priceBar: {
    marginTop: 5,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
});
