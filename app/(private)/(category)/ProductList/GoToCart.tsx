import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { PaginationProps, RootState } from "@/types/global";
import { Platform } from "react-native";
import { useSelector } from "react-redux";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import { router } from "expo-router";
const GoToCart = ({}: any) => {
  console.log("pagination------>");
  const userId = useSelector((state: RootState) => state.auth?.userData?._id);

  const cartButtonProductId = useSelector(
    (state: RootState) => state.cart.cartButtonProductId
  );
  const {
    data: cartData,
    isLoading,
    isSuccess,
    error,
    refetch,
  } = useFetchCartQuery({ userId }, { skip: !userId });
  const cartItems = cartData?.cart?.items?.length || 0;

  if (cartItems == 0) return null;
  return (
    <TouchableOpacity
      onPress={() => {
        router.navigate("/(cartScreen)/cartScreen");
      }}
      style={{
        backgroundColor: Colors.light.gradientGreen_2,
        alignItems: "center",
        paddingVertical: 20,
      }}
    >
      <Text
        style={{ color: Colors.light.white, fontSize: 16, fontWeight: "bold" }}
      >
        {"Go to cart"}
      </Text>
    </TouchableOpacity>
  );
};

export default memo(GoToCart);

const styles = StyleSheet.create({
  paginationWrapper: {
    //position: "absolute",
    // bottom: -50,
    // alignSelf: "center",
    width: "100%",
    //paddingHorizontal: 10,
    // zIndex: 8,
    //paddingVertical: 10,
    // backgroundColor: "red",
    // padding: 20,
  },
  paginationContainer: {
    flexDirection: "row",
    // justifyContent: "space-between",
    // alignItems: "center",
    padding: 15,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    shadowColor: Colors.light.darkGrey,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  button: {
    backgroundColor: Colors.light.gradientGreen_2,
    // paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 30,

    // minWidth: 100,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: Colors.light.lightGrey,
  },
  buttonText: {
    color: Colors.light.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  pageInfo: {
    alignItems: "center",
  },
  pageText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.darkGrey,
  },
  loaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: Colors.light.darkGrey,
  },
});
