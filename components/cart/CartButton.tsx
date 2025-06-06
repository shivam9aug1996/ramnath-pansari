import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { memo, useEffect } from "react";
import { Colors } from "@/constants/Colors";
import { Image } from "expo-image";
import { ThemedText } from "../ThemedText";
import { useCartOperations } from "@/app/(private)/hooks/useCartOperations";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { showToast } from "@/utils/utils";
import AnimatedQuantity from "@/app/(private)/(category)/ProductList/AnimatedQuantity";

const CartButton = ({ item, value, itemHeight }: any) => {
  const { quantity, handleAdd, handleRemove, handleClearAll, buttonClicked } =
    useCartOperations(item?.productDetails, value);
  const cartButtonProductId = useSelector(
    (state: RootState) => state.cart.cartButtonProductId || []
  );


  const isLoading = cartButtonProductId.includes(item?.productDetails?._id);

  return (
    <>
     

      <View style={[styles.quantityContainer]}>
        <TouchableOpacity
          onPress={() => {
            if (isLoading) {
              showToast({
                type: "info",
                text2: "Please wait a moment — we’re still updating your cart.",
              });
              return;
            }
            handleRemove();
          }}
          style={styles.quantityButton}
        >
          <Image
            source={require("../../assets/images/entypo_minus.png")}
            style={styles.icon}
          />
        </TouchableOpacity>
        <AnimatedQuantity variant={3} quantity={quantity} />
        <TouchableOpacity
          onPress={() => {
            if (isLoading) {
              showToast({
                type: "info",
                text2: "Please wait a moment — we’re still updating your cart.",
              });
              return;
            }
            handleAdd();
          }}
          style={styles.quantityButton}
        >
          <Image
            source={require("../../assets/images/entypo_plus.png")}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    </>
  );
};

export default memo(CartButton);

const styles = StyleSheet.create({
  quantityContainer: {
    flexDirection: "row",
    alignSelf: "flex-end",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityButton: {
    padding: 5,
    backgroundColor: "#FFFCFC",
    borderRadius: 8,
  },
  icon: {
    width: 20,
    height: 20,
  },
});
