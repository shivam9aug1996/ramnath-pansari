import React, { memo } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { truncateText } from "@/utils/utils";
import CartButton from "./CartButton";
import { ProductItemProps } from "@/types/global";

import { staticImage } from "../CategoryList/utils";

import { Image } from "expo-image";
import { router } from "expo-router";

const ProductItem = ({ item, index, cartItem }: ProductItemProps) => {
  const nDiscountP = ((item.price - item.discountedPrice) / item.price) * 100;
  const discountP = nDiscountP?.toFixed(2);
  if (cartItem) {
    console.log("redfghjk", cartItem);
  }

  return (
    <View
      style={[
        styles.container,
        {
          marginRight: index % 2 === 0 ? 8.5 : 0,
          marginLeft: index % 2 === 0 ? 0 : 8.5,
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
            {`${discountP} %`}
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
        <View>
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
              {truncateText(item.name, 20)}
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
              {`MRP ₹ ${item.price}`}
            </ThemedText>
            <ThemedText style={styles.productPrice} type="title">
              {`₹ ${item.discountedPrice}`}
            </ThemedText>
          </>
        </View>
        <View style={{ marginTop: 35 }}></View>
      </TouchableOpacity>
      <CartButton value={cartItem?.quantity || 0} item={item} />
    </View>
  );
};

export default memo(ProductItem);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F1F4F3",
    borderRadius: 28,
    flex: 1,
    marginBottom: 20,
    position: "relative",

    // minWidth: "100%",
  },
  image: {
    maxHeight: 100,
    marginBottom: 10,
    minHeight: 100,
  },
  productName: {
    fontSize: 14,
    maxWidth: "80%",
    minHeight: 40,
    maxHeight: 40,
  },
  productPrice: {
    fontSize: 14,
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.lightGreen,
    marginTop: 8,
  },
});
