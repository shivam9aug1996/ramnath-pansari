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
  if (cartItem) {
   
  }
  // console.log("product item------>",item);
  // console.log("iuyfghjkjhgfghjkl", cartItem);

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

      <TouchableOpacity
        onPress={(e) => {
          e?.isPropagationStopped();
          router.navigate(`/(productDetail)/${item?._id}`);
        }}
        style={{ padding: 17 }}
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
          <ThemedText style={styles.productName} type="title">
            {item.name}
          </ThemedText>

          <ThemedText
            style={[
              styles.productPrice,
              {
                textDecorationLine: "line-through",
                textDecorationColor: Colors.light.darkGrey,
                fontSize: 12,
                color: Colors.light.darkGrey,
              },
            ]}
            type="title"
          >
            {`MRP ₹ ${formatNumber(item.price)}`}
          </ThemedText>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <ThemedText style={styles.productPrice} type="title">
              {`₹ ${formatNumber(item.discountedPrice)}`}
            </ThemedText>
            <Text style={styles.size}>{item?.size}</Text>
          </View>
        </>
      </TouchableOpacity>

      <View style={{ marginTop: 35 }}></View>

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
    backgroundColor: "#F1F4F3",
    borderRadius: 28,
    flex: 1,
    // marginBottom: 20,
    position: "relative",
    maxWidth: "50%",
    //marginBottom: 5,

    // minWidth: "100%",
  },
  image: {
    maxHeight: 100,
    marginBottom: 10,
    minHeight: 100,
  },
  productName: {
    fontSize: 11,
    maxWidth: "100%",
    // minHeight: 40,
    // maxHeight: 40,
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
    // position: "absolute",
    // bottom: 0,
    // right: 0,
  },
});
