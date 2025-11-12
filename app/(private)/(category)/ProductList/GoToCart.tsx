import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { Colors } from "@/constants/Colors";
import { RootState } from "@/types/global";
import {
  useFetchCartQuery,
} from "@/redux/features/cartSlice";
import { calculateTotalAmount } from "@/components/cart/utils";
import { formatNumber } from "@/utils/utils";
import ConfettiLottie from "@/components/ConfettiLottie";



const GoToCart = ({ isCart }) => {
  const [cartHeight, setCartHeight] = useState(0);

  const userId = useSelector((state: RootState) => state.auth?.userData?._id);
  

  const { data: cartData,isFetching:isCartFetching} = useFetchCartQuery({ userId }, { skip: !userId });

  const cartItems = cartData?.cart?.items?.length || 0;
  const cartProducts = cartData?.cart?.items || [];

  const totalAmount = useMemo(
    () => +calculateTotalAmount(cartProducts)?.toFixed(2),
    [cartProducts]
  );

  const remainingAmount = Math.max(1000 - totalAmount, 0);


  if (!cartItems) return null;

  const renderOfferMessage = () => (
    <View>
    {/* <ConfettiLottie  remainingAmount={remainingAmount} /> */}
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
    </View>
    </View>
  );

  if (isCart) return renderOfferMessage();
  console.log("cartHeig67898765ht",cartHeight)

  return (
   <View style={{paddingBottom:cartItems>0?cartHeight:0}} >
     <TouchableOpacity
     onLayout={(e)=>{
      console.log("u6543234567890",e.nativeEvent.layout.height)
      setCartHeight(e.nativeEvent.layout.height-35)
     }}
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
   </View>
  );
};

export default memo(GoToCart);
const styles = StyleSheet.create({
  cartButtonContainer: {
    backgroundColor: Colors.light.white,
    paddingVertical: 15,
    paddingTop: 0,
    position:"absolute",
    bottom:0,
    left:0,
    right:0,
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
