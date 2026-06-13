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
import { SHIPPING_FEE } from "@/constants/Delivery";
import {
  getCartSubtotal,
  getDeliveryFee,
  getFreeDeliveryRemaining,
} from "@/utils/deliveryFee";
import { formatNumber } from "@/utils/utils";

const GoToCart = ({ isCart }) => {
  const [cartHeight, setCartHeight] = useState(0);

  const userId = useSelector((state: RootState) => state.auth?.userData?._id);
  

  const { data: cartData,isFetching:isCartFetching} = useFetchCartQuery({ userId }, { skip: !userId });

  const cartItems = cartData?.cart?.items?.length || 0;
  const cartProducts = cartData?.cart?.items || [];

  const subtotal = useMemo(
    () => getCartSubtotal(cartProducts),
    [cartProducts],
  );

  const freeDeliveryRemaining = useMemo(
    () => getFreeDeliveryRemaining(subtotal),
    [subtotal],
  );

  const deliveryFee = useMemo(() => getDeliveryFee(subtotal), [subtotal]);

  const sugarPromoRemaining = Math.max(1000 - subtotal, 0);

  const offerLines = useMemo(() => {
    const lines: {
      text: string;
      variant: "primary" | "secondary" | "deliveryFee";
    }[] = [];

    if (freeDeliveryRemaining > 0) {
      lines.push({
        text: `Add ₹${formatNumber(freeDeliveryRemaining)} more for FREE delivery`,
        variant: "primary",
      });
      lines.push({
        text: `₹${formatNumber(SHIPPING_FEE)} delivery fee on this order`,
        variant: "secondary",
      });
    } else {
      lines.push({
        text: "FREE delivery on this order",
        variant: "primary",
      });
    }

    if (sugarPromoRemaining > 0) {
      lines.push({
        text: `Add ₹${formatNumber(sugarPromoRemaining)} more for 1 kg sugar free`,
        variant: "secondary",
      });
    } else if (subtotal >= 1000) {
      lines.push({
        text: "1 kg sugar free unlocked! 🎉",
        variant: "secondary",
      });
    }

    return lines;
  }, [freeDeliveryRemaining, subtotal, sugarPromoRemaining]);

  if (!cartItems) return null;

  const renderOfferMessage = () => (
    <View style={[styles.offerMessage, isCart && { borderRadius: 10 }]}>
      {offerLines.map((line, index) => (
        <Text
          key={`${line.variant}-${index}`}
          style={
            line.variant === "primary"
              ? styles.offerPrimary
              : line.variant === "deliveryFee"
                ? styles.offerDeliveryFee
                : styles.offerSecondary
          }
          numberOfLines={2}
        >
          {line.text}
        </Text>
      ))}
    </View>
  );

  if (isCart) return renderOfferMessage();

  return (
   <View style={{paddingBottom:cartItems>0?cartHeight:0}} >
     <TouchableOpacity
     onLayout={(e) => {
      setCartHeight(e.nativeEvent.layout.height - 35);
     }}
      onPress={() => router.navigate("/(cartScreen)/cartScreen")}
      style={styles.cartButtonContainer}
    >
      
      {renderOfferMessage()}

      <View style={styles.cartButton}>
         <Text style={styles.cartText} numberOfLines={1}>
            <Text style={styles.cartLabel}>{cartItems} Items | </Text>
            <Text style={styles.cartAmount}>₹{formatNumber(subtotal)}</Text>
            {deliveryFee > 0 ? (
              <Text style={styles.cartDeliveryFee}>
                {" "}
                + ₹{formatNumber(deliveryFee)} delivery
              </Text>
            ) : null}
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
  offerPrimary: {
    color: "white",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Montserrat_700Bold",
    textAlign: "center",
  },
  offerSecondary: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 11,
    lineHeight: 15,
    fontFamily: "Montserrat_500Medium",
    textAlign: "center",
    marginTop: 2,
  },
  offerDeliveryFee: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 9,
    lineHeight: 13,
    fontFamily: "Montserrat_500Medium",
    textAlign: "center",
    marginTop: 1,
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
    flex: 1,
    marginRight: 8,
  },
  cartLabel: {
    color: Colors.light.white,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: "Montserrat_700Bold",
  },
  cartAmount: {
    color: Colors.light.white,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: "Montserrat_700Bold",
  },
  cartDeliveryFee: {
    color: "rgba(255,255,255,1)",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Montserrat_500Medium",
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
