import { FlatList, Platform, StyleSheet, View } from "react-native";
import React, { memo } from "react";
import {
  getProductColumnStyle,
  PRODUCT_IMAGE_ASPECT_RATIO,
  PRODUCT_INFO_HEIGHT,
  PRODUCT_INFO_MARGIN_BOTTOM,
  PRODUCT_ITEM_MARGIN_BOTTOM,
  PRODUCT_LIST_MARGIN_TOP,
  PRODUCT_LIST_PADDING_BOTTOM,
  PRODUCT_LIST_PADDING_TOP,
  PRODUCT_PAGINATION_SKELETON_COUNT,
  PRODUCT_SKELETON_COUNT,
} from "./productListLayout";

const Bone = ({
  width,
  height,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  style?: object;
}) => (
  <View
    style={[
      {
        width,
        height,
        borderRadius: 4,
        backgroundColor: "#f3f3f3",
      },
      style,
    ]}
  />
);

/** Mirrors ProductItem: image → name(2) + size → price + ADD */
const ProductCardSkeleton = ({ index }: { index: number }) => (
  <View style={[styles.container, getProductColumnStyle(index)]}>
    <View style={styles.productCard}>
      <View style={styles.imageContainer}>
        <View style={styles.imageSkeleton} />
      </View>

      <View style={styles.productInfo}>
        <View style={styles.textBlock}>
          <Bone width="95%" height={12} />
          <Bone width="70%" height={12} style={styles.nameLineGap} />
          <Bone width="40%" height={11} style={styles.sizeGap} />
        </View>

        <View style={styles.footer}>
          <View style={styles.priceCol}>
            <Bone width={44} height={14} />
            <Bone width={36} height={10} style={styles.mrpGap} />
          </View>
          <Bone width={76} height={28} style={styles.addBone} />
        </View>
      </View>
    </View>
  </View>
);

const ProductItemSkeleton = ProductCardSkeleton;

export const ProductItemSkeletonStatic = memo(ProductCardSkeleton);

export const ProductPaginationSkeleton = memo(
  ({ count = PRODUCT_PAGINATION_SKELETON_COUNT }: { count?: number }) => (
    <View style={styles.paginationRow}>
      {Array.from({ length: count }, (_, index) => (
        <ProductItemSkeletonStatic
          key={`pagination-skeleton-${index}`}
          index={index}
        />
      ))}
    </View>
  ),
);

export { ProductItemSkeleton };

const ProductsPlaceholder = ({
  wrapperStyle = {},
  contentContainerStyle = {},
}: {
  wrapperStyle?: object;
  contentContainerStyle?: object;
}) => {
  return (
    <FlatList
      bounces={Platform.OS === "android" ? false : true}
      showsVerticalScrollIndicator={false}
      numColumns={2}
      data={Array.from({ length: PRODUCT_SKELETON_COUNT }, (_, index) => ({
        _id: String(index + 1),
      }))}
      keyExtractor={(item) => item._id}
      renderItem={({ index }) => <ProductItemSkeleton index={index} />}
      style={[styles.list, wrapperStyle]}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      scrollEnabled={false}
    />
  );
};

export default memo(ProductsPlaceholder);

const styles = StyleSheet.create({
  paginationRow: {
    flexDirection: "row",
    width: "100%",
    overflow: "hidden",
  },
  list: {
    marginTop: PRODUCT_LIST_MARGIN_TOP,
  },
  contentContainer: {
    paddingTop: PRODUCT_LIST_PADDING_TOP,
    paddingBottom: PRODUCT_LIST_PADDING_BOTTOM,
  },
  container: {
    flex: 1,
    width: "50%",
    marginBottom: PRODUCT_ITEM_MARGIN_BOTTOM,
    maxWidth: "50%",
  },
  productCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#EEF1EF",
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: PRODUCT_IMAGE_ASPECT_RATIO,
    backgroundColor: "#ffffff",
  },
  imageSkeleton: {
    flex: 1,
    margin: 8,
    borderRadius: 8,
    backgroundColor: "#f3f3f3",
  },
  productInfo: {
    height: PRODUCT_INFO_HEIGHT,
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 4,
    marginBottom: PRODUCT_INFO_MARGIN_BOTTOM,
    justifyContent: "space-between",
  },
  textBlock: {
    height: 46,
    justifyContent: "flex-start",
  },
  nameLineGap: {
    marginTop: 3,
  },
  sizeGap: {
    marginTop: 5,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    height: 28,
  },
  priceCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    height: 28,
  },
  mrpGap: {
    marginTop: 2,
  },
  addBone: {
    borderRadius: 8,
  },
});
