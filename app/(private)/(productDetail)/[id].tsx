import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React, { Suspense, useCallback } from "react";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { CartItem, RootState } from "@/types/global";
import {
  setResetPagination,
  useFetchProductDetailQuery,
} from "@/redux/features/productSlice";
import { Colors } from "@/constants/Colors";
import { ThemedText } from "@/components/ThemedText";
import { Image } from "expo-image";
import { staticImage } from "../(category)/CategoryList/utils";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import CartButton from "./CartButton";
import ContentLoader, { Rect } from "react-content-loader/native";
import Animation from "./Animation";
import CustomSuspense from "@/components/CustomSuspense";
import GoToCart from "../(category)/ProductList/GoToCart";

const renderText = () => {
  return (
    <ContentLoader
      speed={1}
      width={"100%"}
      height={100}
      backgroundColor="#f3f3f3"
      foregroundColor="#e3e3e3"
    >
      <Rect width="90%" y={0} rx={5} ry={5} height="25" />
      <Rect width="60%" y={35} rx={5} ry={5} height="25" />
      <Rect width="40%" y={70} rx={5} ry={5} height="25" />
    </ContentLoader>
  );
};

const Product = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isFetching, isSuccess } = useFetchProductDetailQuery(
    { productId: id },
    { skip: !id }
  );
  const dispatch = useDispatch();

  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const { data: cartData, isLoading: isCartLoading } = useFetchCartQuery(
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
  // const isLoading = cartButtonProductId.includes(id);
  const image = data?.product?.image;
  const discountedPrice = data?.product?.discountedPrice;
  const name = data?.product?.name;
  const size = data?.product?.size;
  const price = data?.product?.price;
  const cartItem = cartData?.cart?.items?.find(
    (it: CartItem) => it?.productId === id
  );
  console.log("hgnm,.", data);

  useFocusEffect(
    useCallback(() => {
      if (data?.product == null && router.canGoBack() && isSuccess) {
        dispatch(
          setResetPagination({
            item: {
              _id: id,
            },
            status: true,
          })
        );
        router.back();
      }

      return () => {};
    }, [data?.product, id])
  );

  return (
    <>
      <ScreenSafeWrapper showCartIcon>
        <View
          style={{
            flex: 1,
            marginTop: 37,
            opacity: data?.product?.isOutOfStock ? 0.6 : 1,
          }}
        >
          <View style={{ flex: 0.8 }}>
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
          <View style={{ flex: 0.7, marginTop: 20 }}>
            {/* Product Details */}
            <View style={styles.textContainer}>
              {isFetching ? (
                renderText()
              ) : (
                <>
                  <ThemedText style={styles.productName} type="title">
                    {name}
                  </ThemedText>
                  <Text style={styles.size}>{size}</Text>
                  <ThemedText
                    style={[styles.productPrice, styles.originalPrice]}
                    type="title"
                  >
                    {`MRP ₹ ${price}`}
                  </ThemedText>
                  <ThemedText style={styles.productPrice} type="title">
                    {`₹ ${discountedPrice}`}
                  </ThemedText>
                </>
              )}
            </View>
          </View>
          {isCartLoading ||
          data?.product?.isOutOfStock ||
          !isSuccess ||
          data?.product == null ? null : (
            <CartButton value={cartItem?.quantity || 0} item={data?.product} />
          )}
        </View>
      </ScreenSafeWrapper>

      {data?.product?.isOutOfStock ? (
        <Animation
          id={data?.product?._id}
          isOutOfStock={data?.product?.isOutOfStock}
        />
      ) : data?.product !== null ? (
        // <CustomSuspense>
        <Suspense fallback={null}>
          <GoToCart />
        </Suspense>
      ) : // </CustomSuspense>
      null}
    </>
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
    borderTopLeftRadius: 12,
    marginBottom: 20,
    width: "100%",
    minHeight: 200,
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
  size: {
    fontSize: 14,
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.darkGrey,
    letterSpacing: 0.8,
    // position: "absolute",
    // bottom: 0,
    // right: 0,
  },
});
