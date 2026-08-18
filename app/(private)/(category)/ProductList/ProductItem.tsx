import React, { memo, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  GestureResponderEvent,
} from "react-native";
import { router } from "expo-router";
import { formatNumber } from "@/utils/utils";
import { Product } from "@/types/global";
import CartButton from "./CartButton";
import ProductImage from "./ProductImage";
import {
  getProductColumnStyle,
  PRODUCT_IMAGE_ASPECT_RATIO,
  PRODUCT_INFO_HEIGHT,
  PRODUCT_INFO_MARGIN_BOTTOM,
  PRODUCT_ITEM_MARGIN_BOTTOM,
} from "./productListLayout";

type Props = {
  item: Product;
  index: number;
  quantity: number;
  isCartLoading: boolean;
};

const ProductItem = ({ item, index, quantity, isCartLoading }: Props) => {
  const discountPercentage = useMemo(() => {
    if (!item?.discountedPrice || item.discountedPrice >= item.price) return 0;
    return Math.round(((item.price - item.discountedPrice) / item.price) * 100);
  }, [item?.price, item?.discountedPrice]);

  const handleProductPress = useCallback(
    (e?: GestureResponderEvent) => {
      e?.stopPropagation?.();
      router.navigate({
        pathname: "/(private)/(productDetail)/[id]",
        params: {
          id: item?._id,
          extraData: JSON.stringify(item),
        },
      } as any);
    },
    [item],
  );

  const containerStyle = useMemo(
    () => [styles.container, getProductColumnStyle(index)],
    [index],
  );

  return (
    <View style={containerStyle}>
      <View style={styles.productCard}>
        <View style={styles.imageContainer}>
          <ProductImageInfo
            item={item}
            handleProductPress={handleProductPress}
            discountPercentage={discountPercentage}
          />
        </View>

        <ProductInfo
          handleProductPress={handleProductPress}
          item={item}
          discountPercentage={discountPercentage}
          quantity={quantity || 0}
          isCartLoading={isCartLoading}
        />
      </View>
    </View>
  );
};

export default memo(ProductItem);

// --- Sub-components ---

type ImageInfoProps = {
  item: Product;
  handleProductPress: (e?: GestureResponderEvent) => void;
  discountPercentage: number;
};

const ProductImageInfo = memo(function ProductImageInfo({
  item,
  handleProductPress,
  discountPercentage,
}: ImageInfoProps) {
  const isOutOfStock = item?.isOutOfStock;
  console.log("ProductImageInfo", item?._id);
  return (
    <TouchableOpacity
      onPress={handleProductPress}
      style={styles.imageWrapper}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${item?.name}`}
    >
      {discountPercentage > 0 && !isOutOfStock && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountPct}>{discountPercentage}%</Text>
          <Text style={styles.discountOff}>OFF</Text>
        </View>
      )}

      <View
        style={[
          styles.imageContent,
          isOutOfStock && styles.imageContentOutOfStock,
        ]}
      >
        <ProductImage image={item?.image} />
      </View>
    </TouchableOpacity>
  );
});

type ProductInfoProps = {
  item: Product;
  discountPercentage: number;
  handleProductPress: (e?: GestureResponderEvent) => void;
  quantity: number;
  isCartLoading: boolean;
};

const ProductInfo = memo(function ProductInfo({
  item,
  discountPercentage,
  handleProductPress,
  quantity,
  isCartLoading,
}: ProductInfoProps) {
  const sizeLabel = item?.size?.trim() || "";
  console.log("ProductInfo", item?._id);
  const displayName = useMemo(() => {
    const name = item?.name?.trim() || "";
    if (!sizeLabel) return name;
    if (name.toLowerCase().endsWith(sizeLabel.toLowerCase())) {
      return name
        .slice(0, -sizeLabel.length)
        .trim()
        .replace(/[,\-\/|]+$/, "")
        .trim();
    }
    return name;
  }, [item?.name, sizeLabel]);

  return (
    <View style={styles.productInfo}>
      <View style={styles.textBlock}>
        <TouchableOpacity onPress={handleProductPress} activeOpacity={0.85}>
          <Text
            style={[
              styles.productName,
              item?.isOutOfStock && styles.outOfStockMutedText,
            ]}
            numberOfLines={2}
          >
            {displayName}
          </Text>
          <Text
            style={[
              styles.sizeText,
              item?.isOutOfStock && styles.outOfStockMutedText,
              !sizeLabel && styles.sizeTextHidden,
            ]}
            numberOfLines={1}
          >
            {sizeLabel || " "}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleProductPress}
          style={styles.priceCol}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.currentPrice,
              item?.isOutOfStock && styles.outOfStockMutedText,
            ]}
          >
            ₹{formatNumber(item?.discountedPrice ?? item?.price ?? 0)}
          </Text>
          <Text
            style={[
              styles.originalPrice,
              item?.isOutOfStock && styles.outOfStockMutedText,
              discountPercentage <= 0 && styles.originalPriceHidden,
            ]}
          >
            {discountPercentage > 0 ? `₹${formatNumber(item?.price ?? 0)}` : " "}
          </Text>
        </TouchableOpacity>

        <CartButton value={quantity} item={item} inline isCartLoading={isCartLoading} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
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
  imageWrapper: {
    flex: 1,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContent: {
    width: "100%",
    height: "100%",
  },
  imageContentOutOfStock: {
    opacity: 0.45,
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 0,
    zIndex: 2,
    minWidth: 36,
    paddingTop: 4,
    paddingBottom: 5,
    paddingHorizontal: 7,
    backgroundColor: "#1D4ED8",
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2,
    elevation: 2,
  },
  discountPct: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 13,
    letterSpacing: 0.2,
  },
  discountOff: {
    color: "#DBEAFE",
    fontSize: 8,
    fontWeight: "700",
    lineHeight: 9,
    letterSpacing: 0.6,
    marginTop: 1,
  },
  outOfStockMutedText: {
    opacity: 0.55,
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
  },
  productName: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "700",
    lineHeight: 15,
    height: 30,
  },
  sizeText: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
    lineHeight: 14,
    height: 14,
    marginTop: 2,
  },
  sizeTextHidden: {
    opacity: 0,
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
  currentPrice: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "800",
    lineHeight: 14,
  },
  originalPrice: {
    fontSize: 10,
    color: "#9ca3af",
    textDecorationLine: "line-through",
    fontWeight: "500",
    lineHeight: 12,
  },
  originalPriceHidden: {
    opacity: 0,
    textDecorationLine: "none",
  },
});