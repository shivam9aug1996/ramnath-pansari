import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
        right: 0,
        alignItems: "center",
        padding: 10,
        //paddingRight: 10,
        // backgroundColor: "red",
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
          minWidth: 14,
          height: 14,
          backgroundColor: "#EC534A",
          borderRadius: 7,
          position: "absolute",
          top: 10,
          right: 5,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 2,
        }}
      >
        <Text style={{ color: 'white', fontSize: Platform.OS === "android" ? 8 : 10 }}>
          {cartItems}
        </Text>
      </View>
      )}
    </TouchableOpacity>
  );
};

export default CartIcon;

const styles = StyleSheet.create({});
