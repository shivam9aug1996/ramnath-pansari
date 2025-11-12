import React, { memo, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  GestureResponderEvent,
} from "react-native";
import { formatNumber } from "@/utils/utils";
import { Product, ProductItemProps } from "@/types/global";
import { router } from "expo-router";
import CartButton from "./CartButton";
import ProductImage from "./ProductImage";

const ProductItem = ({ item, index, quantity }: ProductItemProps) => {
  const discountPercentage = useMemo(() => {
    const nDiscountP = ((item.price - item.discountedPrice) / item.price) * 100;
    return Math.round(nDiscountP);
  }, [item.price, item.discountedPrice]);

  const handleProductPress = useCallback(
    (e: GestureResponderEvent) => {
      e?.isPropagationStopped();
      router.navigate({
        pathname: "/(productDetail)/[id]",
        params: {
          id: item?._id,
          extraData: JSON.stringify(item),
        },
      });
    },
    [item?._id]
  );

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        marginRight: index % 2 === 0 ? 4 : 0,
        marginLeft: index % 2 === 0 ? 0 : 4,
      },
    ],
    [index]
  );
  console.log("item3456785678990987654", quantity);

  return (
    <View style={containerStyle}>
      <View style={styles.productCard}>
        <View style={styles.imageContainer}>
          <ProductImageInfo
            item={item}
            handleProductPress={handleProductPress}
          />
          <CartButton value={quantity || 0} item={item} />
        </View>

        <ProductInfo  handleProductPress={handleProductPress} item={item} discountPercentage={discountPercentage} />
      </View>
    </View>
  );
};

export default memo(ProductItem);

const ProductImageInfo = memo(
  ({
    item,
    handleProductPress,
  }: {
    item: Product;
    handleProductPress: any;
  }) => {
    return (
      <TouchableOpacity
        onPress={handleProductPress}
        style={styles.imageWrapper}
      >
        <ProductImage image={item?.image} />
      </TouchableOpacity>
    );
  }
);

const ProductInfo = memo(
  ({
    item,
    discountPercentage,
    handleProductPress,
  }: {
    item: Product;
    discountPercentage: number;
    handleProductPress: any;
  }) => {
    
    return (
      <TouchableOpacity onPress={handleProductPress} style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={3}>
          {item.name}
        </Text>

        {discountPercentage > 0 && (
          <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
        )}

        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>
            ₹{formatNumber(item.discountedPrice)}
          </Text>
          {discountPercentage > 0 && (
            <Text style={styles.originalPrice}>
              MRP ₹{formatNumber(item.price)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: "50%",
    marginBottom: 8,
  },
  productCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    aspectRatio: 1,
    backgroundColor: "#fafafa",
  },
  imageWrapper: {
    flex: 1,
    padding: 8,
  },
  heartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  heartIcon: {
    fontSize: 14,
    color: "#666",
  },
  bestsellerBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#fbbf24",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  bestsellerText: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "600",
  },
  cartButtonContainer: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    zIndex: 2,
  },
  productInfo: {
    padding: 8,
  },
  weightContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
    marginRight: 6,
  },
  weightText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
  productName: {
    fontSize: 13,
    color: "#1f2937",
    fontWeight: "600",
    lineHeight: 16,
    marginBottom: 6,
    minHeight: 48,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  stars: {
    fontSize: 12,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 11,
    color: "#6b7280",
  },
  discountText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "600",
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  currentPrice: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "700",
  },
  originalPrice: {
    fontSize: 12,
    color: "#9ca3af",
    textDecorationLine: "line-through",
    fontWeight: "500",
  },
  perUnitPrice: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
  },
});
