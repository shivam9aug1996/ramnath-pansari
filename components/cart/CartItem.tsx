import React, { lazy, memo, Suspense, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Image } from "expo-image";

import { staticImage } from "@/app/(private)/(category)/CategoryList/utils";
import { Colors } from "@/constants/Colors";
import { ThemedView } from "../ThemedView";
import { CartItemProps } from "@/types/global";
import { ThemedText } from "../ThemedText";
import { formatNumber } from "@/utils/utils";
const CartButton = lazy(() => import("./CartButton"));

const CartItem = ({ item, order = false }: CartItemProps) => {
  const [itemHeight, setItemHeight] = useState(0);

  console.log("jhgfdfghjkl cart item", JSON.stringify(item));
  const nDiscountP =
    ((item?.productDetails?.price - item?.productDetails?.discountedPrice) /
      item?.productDetails?.price) *
    100;
  const discountP = Math.round(nDiscountP);

  return (
    <>
      <ThemedView
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setItemHeight(height);
        }}
        style={[styles.container]}
      >
        {nDiscountP ? (
          <View
            style={{
              position: "absolute",
              backgroundColor: Colors.light.lightGreen,

              zIndex: 1,
              paddingHorizontal: 8,
              paddingVertical: 3,
              // borderTopLeftRadius: 28,
              // borderBottomRightRadius: 28,
              left: 10,
              top: 10,
            }}
          >
            <Text
              style={{
                color: Colors.light.white,
                fontSize: 12,
                fontFamily: "Montserrat_700Bold",
              }}
            >
              {`${discountP}%`}
            </Text>
          </View>
        ) : null}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item?.productDetails?.image || staticImage }}
            placeholder={staticImage}
            style={styles.image}
            contentFit="contain"
          />
        </View>
        <View style={styles.detailsContainer}>
          <ThemedText style={styles.productName}>
            {item?.productDetails?.name}
          </ThemedText>
          <Text style={styles.size}>{item?.productDetails?.size}</Text>

          <ThemedText
            style={[
              styles.unitPrice,
              {
                textDecorationLine: "line-through",
                textDecorationColor: Colors.light.darkGrey,
                fontSize: 12,
                // color: Colors.light.darkGrey,
              },
            ]}
            type="title"
          >
            {`MRP ₹ ${item?.productDetails?.price}`}
          </ThemedText>
          <ThemedText style={styles.unitPrice}>
            {`Unit price ₹${item?.productDetails?.discountedPrice}`}
          </ThemedText>

          <ThemedText style={styles.totalPrice}>
            {`₹ ${formatNumber(
              item?.productDetails?.discountedPrice * item?.quantity
            )}`}
          </ThemedText>
        </View>
        {order ? (
          <View style={{ justifyContent: "flex-end", marginRight: 10 }}>
            <ThemedText style={styles.unitPrice}>
              {`${item?.quantity || 0} Quantity`}
            </ThemedText>
          </View>
        ) : (
          <Suspense fallback={null}>
            <CartButton
              item={item}
              value={item?.quantity || 0}
              itemHeight={itemHeight}
            />
          </Suspense>
        )}
      </ThemedView>
      {/* </Swipeable> */}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#F1F4F3",
    padding: 20,
    borderRadius: 23,
    flex: 1,
    justifyContent: "flex-start",
    marginBottom: 20,
  },
  imageContainer: {
    flex: 0.35,
  },
  image: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  detailsContainer: {
    justifyContent: "space-evenly",
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontFamily: "Raleway_700Bold",
    color: Colors.light.darkGreen,
  },
  unitPrice: {
    fontSize: 11,
    fontFamily: "Montserrat_500Medium",
    color: Colors.light.mediumGrey,
    marginVertical: 3,
  },
  totalPrice: {
    fontSize: 20,
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.lightGreen,
  },
  size: {
    fontSize: 10,
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.darkGrey,
    letterSpacing: 0.8,
    paddingVertical: 6,
    // position: "absolute",
    // bottom: 0,
    // right: 0,
  },
});

export default memo(CartItem);
