import React, { memo, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { Colors } from "@/constants/Colors";
import { RootState } from "@/types/global";
import {
  setShowConfetti,
  useFetchCartQuery,
} from "@/redux/features/cartSlice";
import { calculateTotalAmount } from "@/components/cart/utils";
import { formatNumber } from "@/utils/utils";



const GoToCart = ({ isCart }) => {

  const userId = useSelector((state: RootState) => state.auth?.userData?._id);
  const isCartProcessing = useSelector((state: RootState) => state.cart?.isCartOperationProcessing);
  const cartButtonProductId = useSelector((state: RootState) => state.cart?.cartButtonProductId);

  const { data: cartData,isFetching:isCartFetching} = useFetchCartQuery({ userId }, { skip: !userId });

  const cartItems = cartData?.cart?.items?.length || 0;
  const cartProducts = cartData?.cart?.items || [];

  const totalAmount = useMemo(
    () => +calculateTotalAmount(cartProducts)?.toFixed(2),
    [cartProducts]
  );

  const remainingAmount = Math.max(1000 - totalAmount, 0);


// console.log("isCartFetching",isCartFetching,cartButtonProductId,isCartProcessing)
  if (!cartItems) return null;

  const renderOfferMessage = () => (
    <View style={[styles.offerMessage, isCart && { borderRadius: 10 }]}>
      <Text style={styles.offerText} numberOfLines={2}>
        {remainingAmount > 0 ? (
          <>
            Add items worth{" "}
            <Text style={styles.remainingAmount}>
              ₹{formatNumber(remainingAmount)}
            </Text>{" "}
            to get 1 kg sugar free
          </>
        ) : (
          <>Congratulations! You are eligible for 1 kg sugar free! 🎉</>
        )}
      </Text>
      {/* {showConfetti && <AnimatedBorder isCart={isCart} />} */}
    </View>
  );

  if (isCart) return renderOfferMessage();

  return (
    <TouchableOpacity
      onPress={() => router.navigate("/(cartScreen)/cartScreen")}
      style={styles.cartButtonContainer}
    >
      {renderOfferMessage()}

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
    fontSize: 12,
    fontFamily: "Raleway_700Bold",
    textAlign: "center",
  },
  remainingAmount: {
    color: "#e2ea91",
    fontSize: 14,
    fontFamily: "Montserrat_700Bold",
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
  cartUpdating: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
});
