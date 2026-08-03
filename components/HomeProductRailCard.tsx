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
import ProductImage from "@/app/(private)/(category)/ProductList/ProductImage";
import CartButton from "@/app/(private)/(category)/ProductList/CartButton";

const CARD_WIDTH = 140;

type Props = {
  item: Product;
};

const HomeProductRailCard = ({ item }: Props) => {
  const discountPercentage = useMemo(() => {
    if (!item.price || item.price <= item.discountedPrice) return 0;
    return Math.round(((item.price - item.discountedPrice) / item.price) * 100);
  }, [item.price, item.discountedPrice]);

  const handlePress = useCallback(
    (e?: GestureResponderEvent) => {
      e?.stopPropagation?.();
      router.navigate({
        pathname: "/(productDetail)/[id]",
        params: {
          id: item._id,
          extraData: JSON.stringify(item),
        },
      });
    },
    [item],
  );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <TouchableOpacity
            onPress={handlePress}
            style={styles.imageWrapper}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.imageContent,
                item.isOutOfStock && styles.imageOutOfStock,
              ]}
            >
              <ProductImage image={item.image} />
            </View>
          </TouchableOpacity>
          <CartButton value={0} item={item} />
        </View>

        <TouchableOpacity
          onPress={handlePress}
          style={styles.info}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.name,
              item.isOutOfStock && styles.mutedText,
            ]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.discount,
              item.isOutOfStock && styles.mutedText,
              discountPercentage <= 0 && styles.discountHidden,
            ]}
          >
            {discountPercentage > 0 ? `${discountPercentage}% OFF` : " "}
          </Text>
          <View style={styles.priceRow}>
            <Text
              style={[
                styles.price,
                item.isOutOfStock && styles.mutedText,
              ]}
            >
              ₹{formatNumber(item.discountedPrice)}
            </Text>
            {discountPercentage > 0 ? (
              <Text
                style={[
                  styles.mrp,
                  item.isOutOfStock && styles.mutedText,
                ]}
              >
                ₹{formatNumber(item.price)}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default memo(HomeProductRailCard);

export const HOME_RAIL_CARD_WIDTH = CARD_WIDTH;

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginRight: 12,
  },
  card: {
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
    padding: 6,
  },
  imageContent: {
    flex: 1,
  },
  imageOutOfStock: {
    opacity: 0.45,
  },
  info: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 10,
  },
  name: {
    fontSize: 12,
    color: "#1f2937",
    fontWeight: "600",
    lineHeight: 16,
    minHeight: 32,
    marginBottom: 4,
  },
  discount: {
    fontSize: 11,
    color: "#2563eb",
    fontWeight: "600",
    marginBottom: 2,
    minHeight: 14,
  },
  discountHidden: {
    opacity: 0,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 18,
  },
  price: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "700",
  },
  mrp: {
    fontSize: 11,
    color: "#9ca3af",
    textDecorationLine: "line-through",
    fontWeight: "500",
  },
  mutedText: {
    opacity: 0.55,
  },
});
