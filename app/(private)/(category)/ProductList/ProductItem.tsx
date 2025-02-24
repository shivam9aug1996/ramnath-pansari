import React, { lazy, memo, Suspense } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { formatNumber, truncateText } from "@/utils/utils";
// import CartButton from "./CartButton";
import { ProductItemProps } from "@/types/global";

import { staticImage } from "../CategoryList/utils";

import { Image } from "expo-image";
import { router } from "expo-router";
const CartButton = lazy(() => import("./CartButton"));

const ProductItem = ({
  item,
  index,
  cartItem,
  isCartLoading,
  isProductsFetching,
  paginationState,
}: ProductItemProps) => {
  const nDiscountP = ((item.price - item.discountedPrice) / item.price) * 100;
  const discountP = Math.round(nDiscountP);

  return (
    <View
      style={[
        styles.container,
        {
          marginRight: index % 2 === 0 ? 8.5 : 0,
          marginLeft: index % 2 === 0 ? 0 : 8.5,
          opacity:
            (isProductsFetching && paginationState?.page == 1) ||
            item?.isOutOfStock
              ? 0.6
              : 1,
          pointerEvents:
            isProductsFetching && paginationState?.page == 1 ? "none" : "auto",
        },
      ]}
    >
      {nDiscountP ? (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{`${discountP}%`}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        onPress={(e) => {
          e?.isPropagationStopped();
          router.navigate(`/(productDetail)/${item?._id}`);
        }}
        style={styles.productContent}
      >
        <Image
          source={{
            uri: item?.image || staticImage,
          }}
          style={styles.image}
          contentFit={"contain"}
          cachePolicy={"disk"}
        />
        <>
          <ThemedText 
            style={styles.productName} 
            type="title"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.name}
          </ThemedText>

          <ThemedText 
            style={styles.mrpPrice} 
            type="title"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {`MRP ₹ ${formatNumber(item.price)}`}
          </ThemedText>
          <View style={styles.priceContainer}>
            <ThemedText style={styles.productPrice} type="title">
              {`₹ ${formatNumber(item.discountedPrice)}`}
            </ThemedText>
            <Text style={styles.size}>{item?.size}</Text>
          </View>
        </>
      </TouchableOpacity>

      <View style={styles.cartButtonSpacing} />

      {isCartLoading ? null : (
        <Suspense fallback={null}>
          <CartButton value={cartItem?.quantity || 0} item={item} />
        </Suspense>
      )}
    </View>
  );
};

export default memo(ProductItem);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.softGrey_1,
    borderRadius: 28,
    flex: 1,
    position: "relative",
    maxWidth: "50%",
  },
  discountBadge: {
    position: "absolute",
    backgroundColor: Colors.light.lightGreen,
    zIndex: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    left: 10,
    top: 10,
  },
  discountText: {
    color: Colors.light.white,
    fontSize: 12,
    fontFamily: "Montserrat_700Bold",
  },
  productContent: {
    padding: 17,
  },
  image: {
    maxHeight: 100,
    marginBottom: 10,
    minHeight: 100,
  },
  productName: {
    fontSize: 11,
    maxWidth: "100%",
    marginBottom: 4,
    minHeight: 28,
    lineHeight: 14,
  },
  mrpPrice: {
    textDecorationLine: "line-through",
    textDecorationColor: Colors.light.darkGrey,
    fontSize: 12,
    color: Colors.light.darkGrey,
    marginBottom: 4,
    minHeight: 32,
    lineHeight: 16,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productPrice: {
    fontSize: 14,
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.lightGreen,
  },
  size: {
    fontSize: 10,
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.darkGrey,
    letterSpacing: 0.8,
  },
  cartButtonSpacing: {
    marginTop: 35,
  },
});
