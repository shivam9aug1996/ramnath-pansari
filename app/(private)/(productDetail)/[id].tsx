import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";
import { CartItem, RootState } from "@/types/global";
import { useFetchProductDetailQuery } from "@/redux/features/productSlice";
import { Colors } from "@/constants/Colors";
import { ThemedText } from "@/components/ThemedText";
import { Image } from "expo-image";
import { staticImage } from "../(category)/CategoryList/utils";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import CartButton from "./CartButton";

const Product = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useFetchProductDetailQuery({ productId: id }, { skip: !id });

  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const { data: cartData } = useFetchCartQuery(
    {
      userId,
    },
    {
      skip: !userId,
    }
  );
  const cartButtonProductId = useSelector(
    (state: RootState) => state.cart.cartButtonProductId || []
  );
  const isLoading = cartButtonProductId.includes(id);
  const image = data?.product?.image;
  const discountedPrice = data?.product?.discountedPrice;
  const name = data?.product?.name;
  const price = data?.product?.price;
  const cartItem = cartData?.cart?.items?.find(
    (it: CartItem) => it?.productId === id
  );

  return (
    <ScreenSafeWrapper showCartIcon>
      <View style={{ flex: 1, marginTop: 37 }}>
        <View style={{ flex: 1 }}>
          {/* Product Image */}
          <Image
            source={{
              uri: image || staticImage,
            }}
            style={styles.image}
            contentFit={"contain"}
            cachePolicy={"disk"}
          />
        </View>
        <View style={{ flex: 1 }}>
          {/* Product Details */}
          <View style={styles.textContainer}>
            <ThemedText style={styles.productName} type="title">
              {name}
            </ThemedText>
            <ThemedText
              style={[styles.productPrice, styles.originalPrice]}
              type="title"
            >
              {`MRP ₹ ${price}`}
            </ThemedText>
            <ThemedText style={styles.productPrice} type="title">
              {`₹ ${discountedPrice}`}
            </ThemedText>
          </View>
        </View>
        <CartButton value={cartItem?.quantity || 0} item={data?.product} />
      </View>
    </ScreenSafeWrapper>
  );
};

export default Product;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textContainer: {
    paddingHorizontal: 10,
    marginTop: 10,
    // alignItems: "center",
  },
  productName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
    fontFamily: "Montserrat_700Bold",
    // textAlign: "center",
  },
  productPrice: {
    fontSize: 18,
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.lightGreen,
    marginTop: 5,
  },
  originalPrice: {
    textDecorationLine: "line-through",
    textDecorationColor: Colors.light.darkGrey,
    fontSize: 16,
    color: Colors.light.darkGrey,
  },
  image: {
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
    width: "100%",
  },
  addToCartButton: {
    marginTop: 25,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    width: "90%",
    backgroundColor: Colors.light.lightGreen,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  addToCartText: {
    color: Colors.light.white,
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Montserrat_600SemiBold",
  },
});
