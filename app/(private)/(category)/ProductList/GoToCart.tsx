import React, { memo, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { useSelector } from "react-redux";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import { router } from "expo-router";
import { calculateTotalAmount } from "@/components/cart/utils";
import { formatNumber } from "@/utils/utils";
import { Ionicons } from "@expo/vector-icons";

const GoToCart = ({ isCart }) => {
  const userId = useSelector((state) => state.auth?.userData?._id);
  const { data: cartData } = useFetchCartQuery({ userId }, { skip: !userId });
  const cartItems = cartData?.cart?.items?.length || 0;
  const totalAmount = useMemo(
    () => calculateTotalAmount(cartData?.cart?.items)?.toFixed(2),
    [cartData?.cart?.items]
  );

  if (!cartItems) return null;

  const remainingAmount = Math.max(1000 - (totalAmount || 0), 0);

  if (isCart) {
    return remainingAmount > 0 ? (
      <View
        style={[
          styles.offerMessage,
          {
            borderRadius: 10,
            marginBottom: 0,
          },
        ]}
      >
        <Text style={styles.offerText}>
          {`Add items worth `}
          <Text style={styles.remainingAmount}>{`₹${formatNumber(
            remainingAmount
          )}`}</Text>
          {` to get 
1 kg sugar free`}
        </Text>
      </View>
    ) : (
      <View
        style={[
          styles.offerMessage,
          {
            borderRadius: 10,
            marginBottom: 0,
          },
        ]}
      >
        <Text style={styles.offerText}>
          {"Congratulations! You are eligible for 1 kg sugar free! 🎉 "}
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => router.navigate("/(cartScreen)/cartScreen")}
      style={styles.cartButtonContainer}
    >
      {remainingAmount > 0 ? (
        <View style={styles.offerMessage}>
          <Text style={styles.offerText}>
            {`Add items worth `}
            <Text style={styles.remainingAmount}>{`₹${formatNumber(
              remainingAmount
            )}`}</Text>
            {` to get 1 kg sugar free`}
          </Text>
        </View>
      ) : (
        <View style={styles.offerMessage}>
          <Text style={styles.offerText}>
            {`Congratulations! You are eligible for 1 kg sugar free! 🎉 `}
          </Text>
        </View>
      )}
      <View style={styles.cartButton}>
        <Text style={styles.cartText}>
          {`${cartItems} Items | ₹${formatNumber(totalAmount)}`}
        </Text>
        <View style={styles.cartAction}>
          <Ionicons name="bag-outline" size={18} color={Colors.light.white} />
          <Text style={styles.cartActionText}>View Cart</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default memo(GoToCart);

const styles = StyleSheet.create({
  cartButtonContainer: {
    backgroundColor: Colors.light.white,
    paddingVertical: 15,
    paddingTop: 0,
  },
  offerMessage: {
    backgroundColor: "#967c8e",
    marginBottom: 5,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  offerText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Raleway_700Bold",
    textAlign: "center",
    //letterSpacing: 0.3,
  },
  cartButton: {
    backgroundColor: Colors.light.gradientGreen_1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginHorizontal: 10,
  },
  cartText: {
    color: Colors.light.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  cartAction: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartActionText: {
    color: Colors.light.white,
    fontSize: 16,
    marginLeft: 5,
    fontFamily: "Raleway_700Bold",
  },
  remainingAmount: {
    color: "#e2ea91",
    fontSize: 14,
    fontFamily: "Montserrat_700Bold",
  },
});
