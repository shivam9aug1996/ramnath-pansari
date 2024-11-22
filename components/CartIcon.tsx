import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { Image } from "expo-image";
import { ThemedView } from "./ThemedView";
import { router, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { useFetchCartQuery } from "@/redux/features/cartSlice";

const CartIcon = () => {
  // const router = useRouter();
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const {
    data: cartData,
    isFetching: isCartFetching,
    isError: isCartError,
    isLoading: isCartLoading,
  } = useFetchCartQuery(
    {
      userId,
    },
    {
      skip: !userId,
    }
  );
  const cartItems = cartData?.cart?.items?.length || 0;
  console.log("8765edfghjk", cartItems);
  return (
    <TouchableOpacity
      onPress={() => {
        router.navigate("/(cartScreen)/cartScreen");
      }}
      style={{
        position: "absolute",
        right: 10,
        alignItems: "center",
        // zIndex: -1,
      }}
    >
      <Image
        tintColor={"#777777"}
        source={require("../assets/images/bag.png")}
        style={{
          width: 20,
          height: 23,
        }}
      />
      {cartItems > 0 && (
        <View
          style={{
            width: 6,
            height: 6,
            backgroundColor: "#EC534A",
            borderRadius: 3,
            position: "absolute",
            right: -4,
            top: -1.5,
          }}
        />
      )}
    </TouchableOpacity>
  );
};

export default CartIcon;

const styles = StyleSheet.create({});
