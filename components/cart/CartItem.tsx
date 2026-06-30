import React, { memo, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Image } from "expo-image";

import { staticImage } from "@/app/(private)/(category)/CategoryList/utils";
import { Colors } from "@/constants/Colors";
import { ThemedView } from "../ThemedView";
import { CartItemProps } from "@/types/global";
import { ThemedText } from "../ThemedText";
import { formatNumber, truncateText } from "@/utils/utils";
import { isPromoFreebieLine } from "@/utils/cartOfferUtils";
import CartButton from "./CartButton";

const CartItem = ({ item, order = false }: CartItemProps) => {
  const [itemHeight, setItemHeight] = useState(0);

  const isPromo = isPromoFreebieLine(item);
  const promoPrice =
    item?.promoPrice ?? item?.productDetails?.discountedPrice ?? 0;
  const isFullyFree = promoPrice === 0;

  const price = item?.productDetails?.price ?? 0;
  const nDiscountP =
    price > 0 ? ((price - promoPrice) / price) * 100 : 0;
  const discountP = Math.round(nDiscountP);
  const showPercentBadge = nDiscountP > 0 && !isPromo;
  const promoMeta = isPromo
    ? isFullyFree
      ? "Free gift"
      : `Offer · ₹${promoPrice}`
    : isFullyFree
      ? "Free"
      : null;

  return (
    <ThemedView
      style={[
        styles.container,
        (isPromo || isFullyFree) && styles.freeItemBorder,
      ]}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: item?.productDetails?.image || staticImage }}
          placeholder={staticImage}
          style={styles.image}
          contentFit="contain"
        />
        {showPercentBadge ? (
          <View style={styles.percentBadge}>
            <Text style={styles.percentBadgeText}>{`${discountP}%`}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.detailsContainer}>
        <ThemedText style={styles.productName} numberOfLines={2}>
          {truncateText(item?.productDetails?.name, 40)}
        </ThemedText>

        <View style={styles.metaRow}>
          <Text style={styles.size}>{item?.productDetails?.size}</Text>
          {promoMeta ? (
            <View style={styles.promoPill}>
              <Text style={styles.promoPillText}>{promoMeta}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.priceContainer}>
          <ThemedText style={[styles.unitPrice, styles.strikethrough]}>
            {`MRP ₹${item?.productDetails?.price}`}
          </ThemedText>
          <ThemedText style={[styles.unitPrice, styles.discountedPrice]}>
            {`₹${promoPrice}`}
          </ThemedText>
        </View>

        <ThemedText style={styles.totalPrice}>
          {`₹${formatNumber(promoPrice * item?.quantity)}`}
        </ThemedText>
      </View>

      {order ? (
        <View style={styles.quantityContainer}>
          <ThemedText style={styles.unitPrice}>
            {`${item?.quantity || 0} Quantity`}
          </ThemedText>
        </View>
      ) : (
        !isPromo &&
        promoPrice !== 0 && (
          <CartButton
            item={item}
            value={item?.quantity || 0}
            itemHeight={itemHeight}
          />
        )
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#F1F4F3",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  freeItemBorder: {
    borderWidth: 2,
    borderColor: "#2cc3aa",
  },
  imageWrap: {
    width: 52,
    height: 52,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  percentBadge: {
    position: "absolute",
    top: -4,
    left: -4,
    backgroundColor: Colors.light.lightGreen,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 1,
  },
  percentBadgeText: {
    color: Colors.light.white,
    fontSize: 11,
    fontFamily: "Montserrat_700Bold",
  },
  detailsContainer: {
    flex: 1,
    gap: 4,
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  promoPill: {
    backgroundColor: "#E8F7F3",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  promoPillText: {
    fontSize: 10,
    fontFamily: "Montserrat_700Bold",
    color: "#0F766E",
  },
  priceContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  productName: {
    fontSize: 12,
    fontFamily: "Montserrat_700Bold",
    color: Colors.light.darkGreen,
  },
  unitPrice: {
    fontSize: 12,
    fontFamily: "Montserrat_500Medium",
    color: Colors.light.mediumGrey,
  },
  strikethrough: {
    textDecorationLine: "line-through",
    textDecorationColor: Colors.light.darkGrey,
    fontSize: 11,
  },
  discountedPrice: {
    fontFamily: "Montserrat_700Bold",
  },
  totalPrice: {
    fontSize: 16,
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.lightGreen,
  },
  size: {
    fontSize: 10,
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.darkGrey,
    letterSpacing: 0.8,
  },
  quantityContainer: {
    justifyContent: "flex-end",
    marginRight: 8,
  },
});

export default memo(CartItem);
