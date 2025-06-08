import React, { memo, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";

import { Colors } from "@/constants/Colors";

import { CartButtonProps, RootState } from "@/types/global";

import { useCartOperations } from "../../hooks/useCartOperations";
import Animation from "./Animation";
import { useSelector } from "react-redux";
import { Image } from "expo-image";
import { useCartOperationsV1 } from "../../hooks/useCartOperationsV1";
import { hideAllToast, showToast } from "@/utils/utils";
import Animated, { useSharedValue } from "react-native-reanimated";
import { withSequence } from "react-native-reanimated";
import { withTiming } from "react-native-reanimated";
import { useAnimatedStyle } from "react-native-reanimated";
import AnimatedQuantity from "./AnimatedQuantity";

const CartButton = ({ value, item }: CartButtonProps) => {
  const { quantity, handleAdd, handleRemove } = useCartOperations(item, value);
    const cartButtonProductId = useSelector(
    (state: RootState) => state.cart.cartButtonProductId || []
  );


  
  const isLoading = cartButtonProductId.includes(item?._id);


  // useEffect(()=>{
  //   if(isLoading===false){
  //     setTimeout(() => {
  //       hideAllToast()
  //     }, 200);
  //   }
  // },[isLoading])
  return (
    <View style={[styles.container]}>
      {!item?.isOutOfStock && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: quantity > 0 ? "space-between" : "flex-end",
          }}
        >
          {quantity > 0 && (
            <TouchableOpacity
              disabled={item?.isOutOfStock}
              onPress={()=>{
                if(isLoading){
                  showToast({
                    type: "info",
                    text2:
                      "Please wait a moment — we’re still updating your cart.",
                });
                return;
              }
              handleRemove();
            }}
              style={[styles.removeButton]}
            >
              <Image
                source={require("../../../../assets/images/entypo_minus.png")}
                style={styles.icon}
                tintColor="white"
              />
            </TouchableOpacity>
          )}

          {/* {quantity > 0 && (
            <View style={styles.quantityContainer}>
              {<Text style={styles.quantityText}>{quantity}</Text>}
            </View>
            
          )} */}
          {quantity > 0 && <AnimatedQuantity quantity={quantity} />}

          <TouchableOpacity
            disabled={item?.isOutOfStock}
            onPress={()=>{
              if(isLoading){
                showToast({
                  type: "info",
                  text2:
                    "Please wait a moment — we’re still updating your cart.",
                });
                return;
              }
              handleAdd();
            }}
            style={[styles.addButton]}
          >
            <Image
              source={require("../../../../assets/images/entypo_plus.png")}
              style={styles.icon}
              tintColor="white"
            />
          </TouchableOpacity>
        </View>
      )}
      {/* {isLoading&&<Text>hi</Text>} */}
      {/* <Animation id={item?._id} isOutOfStock={item?.isOutOfStock} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    flex: 1,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  addButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 28,
    backgroundColor: Colors.light.gradientGreen_2,
  },
  removeButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 28,
    backgroundColor: Colors.light.gradientGreen_2,
  },
  quantityContainer: {
    alignSelf: "center",
    paddingBottom: 5,
    fontFamily: "Montserrat_500Medium",
  },
  quantityText: {
    fontSize: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 18,
    height: 18,
  },
  updateContainer: {
    backgroundColor: Colors.light.lightGrey,
    position: "absolute",
    width: "100%",
    height: 60,
    bottom: 0,
    borderBottomRightRadius: 28,
    borderBottomLeftRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 700,
  },
});

export default memo(CartButton);
