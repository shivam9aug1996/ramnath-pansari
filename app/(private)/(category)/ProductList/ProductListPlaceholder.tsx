import { FlatList, Platform, StyleSheet, View } from "react-native";
import React, { memo } from "react";
import ContentLoader, { Rect } from "react-content-loader/native";
import {
  getProductColumnStyle,
  PRODUCT_CARD_HEIGHT,
  PRODUCT_ITEM_MARGIN_BOTTOM,
  PRODUCT_LIST_MARGIN_TOP,
  PRODUCT_LIST_PADDING_BOTTOM,
  PRODUCT_LIST_PADDING_TOP,
  PRODUCT_SKELETON_COUNT,
} from "./productListLayout";

const LoaderBlock = ({
  width = "100%",
  height = 13,
}: {
  width?: number | string;
  height?: number;
}) => (
  <ContentLoader
    speed={1}
    width={width}
    height={height}
    backgroundColor="#f3f3f3"
    foregroundColor="#e3e3e3"
  >
    <Rect width={width} y={0} rx={5} ry={5} height={height} />
  </ContentLoader>
);

const ProductItemSkeleton = ({ index }: { index: number }) => (
  <View style={[styles.container, getProductColumnStyle(index)]}>
    <View style={styles.productCard}>
      <View style={styles.imageContainer}>
        <View style={styles.imageSkeleton} />
        <View style={styles.cartButtonSkeleton} />
      </View>

      <View style={styles.productInfo}>
        <View style={styles.nameSkeleton}>
          <LoaderBlock width="95%" height={13} />
          <LoaderBlock width="80%" height={13} />
          <LoaderBlock width="60%" height={13} />
        </View>
        <LoaderBlock width="45%" height={12} />
        <View style={styles.priceSkeleton}>
          <LoaderBlock width="55%" height={16} />
          <LoaderBlock width="45%" height={12} />
        </View>
      </View>
    </View>
  </View>
);

export const ProductPaginationSkeleton = ({ count = 2 }: { count?: number }) => (
  <View style={styles.paginationRow}>
    {Array.from({ length: count }, (_, index) => (
      <ProductItemSkeleton key={`pagination-skeleton-${index}`} index={index} />
    ))}
  </View>
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
    flexWrap: "wrap",
    width: "100%",
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
    overflow: "hidden",
    height: PRODUCT_CARD_HEIGHT,
  },
  imageContainer: {
    position: "relative",
    aspectRatio: 1,
    backgroundColor: "#fafafa",
  },
  imageSkeleton: {
    flex: 1,
    margin: 8,
    borderRadius: 8,
    backgroundColor: "#f3f3f3",
  },
  cartButtonSkeleton: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  productInfo: {
    padding: 8,
    gap: 4,
  },
  nameSkeleton: {
    minHeight: 48,
    gap: 3,
    marginBottom: 2,
  },
  priceSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
});
