import React, { memo, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Image } from "expo-image";

import { staticImage } from "@/app/(private)/(category)/CategoryList/utils";
import { Colors } from "@/constants/Colors";
import { ThemedView } from "../ThemedView";
import { CartItemProps } from "@/types/global";
import { ThemedText } from "../ThemedText";
import { formatNumber, truncateText } from "@/utils/utils";
import CartButton from "./CartButton";
const CartItem = ({ item, order = false }: CartItemProps) => {
  const [itemHeight, setItemHeight] = useState(0);

  console.log("jhgfdfghjkl cart item", item?.productDetails?._id);
  const nDiscountP =
    ((item?.productDetails?.price - item?.productDetails?.discountedPrice) /
      item?.productDetails?.price) *
    100;
  const discountP = Math.round(nDiscountP);

  return (
    <ThemedView
      // onLayout={(event) => {
      //   const { height } = event.nativeEvent.layout;
      //   setItemHeight(height);
      //   console.log('CartItem actual height:', height);
      // }}
      style={[
        styles.container,
        item?.productDetails?.discountedPrice == 0 && styles.freeItemBorder,
      ]}
    >
      {nDiscountP ? (
        <View
          style={[
            styles.discountBadge,
            {
              backgroundColor:
                item?.productDetails?.discountedPrice == 0
                  ? "#967c8e"
                  : Colors.light.lightGreen,
            },
          ]}
        >
          <Text style={styles.discountText}>
            {item?.productDetails?.discountedPrice == 0
              ? "Free"
              : `${discountP}%`}
          </Text>
        </View>
      ) : null}

      <Image
        source={{ uri: item?.productDetails?.image || staticImage }}
        placeholder={staticImage}
        style={styles.image}
        contentFit="contain"
      />

      <View style={styles.detailsContainer}>
        <ThemedText style={styles.productName}>
          {truncateText(item?.productDetails?.name, 40)}
        </ThemedText>
        <Text style={styles.size}>{item?.productDetails?.size}</Text>

        <View style={styles.priceContainer}>
          <ThemedText style={[styles.unitPrice, styles.strikethrough]}>
            {`MRP ₹${item?.productDetails?.price}`}
          </ThemedText>
          <ThemedText style={[styles.unitPrice, styles.discountedPrice]}>
            {`₹${item?.productDetails?.discountedPrice}`}
          </ThemedText>
        </View>

        <ThemedText style={styles.totalPrice}>
          {`₹${formatNumber(
            item?.productDetails?.discountedPrice * item?.quantity
          )}`}
        </ThemedText>
      </View>

      {order ? (
        <View style={styles.quantityContainer}>
          <ThemedText style={styles.unitPrice}>
            {`${item?.quantity || 0} Quantity`}
          </ThemedText>
        </View>
      ) : (
        item?.productDetails?.discountedPrice != 0 && (
          // <DeferredFadeIn delay={0} fallback={<View style={{width:88,height:30,}}/>}>
          <CartButton
            key={item?.productDetails?._id}
            item={item}
            value={item?.quantity || 0}
            itemHeight={itemHeight}
          />
          // </DeferredFadeIn>
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
  discountBadge: {
    position: "absolute",
    zIndex: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    left: 8,
    top: 8,
    borderRadius: 4,
  },
  discountText: {
    color: Colors.light.white,
    fontSize: 11,
    fontFamily: "Montserrat_700Bold",
  },
  image: {
    width: 45,
    height: 45,
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
    gap: 4,
  },
  priceContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  productName: {
    fontSize: 12,
    fontFamily: "Raleway_700Bold",
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
