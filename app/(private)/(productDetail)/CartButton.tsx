import React, { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";

import { Colors } from "@/constants/Colors";
import { CartButtonProps, RootState } from "@/types/global";
import { useCartOperations } from "../hooks/useCartOperations";
import { useSelector } from "react-redux";
import { showToast } from "@/utils/utils";
import AnimatedQuantity from "../(category)/ProductList/AnimatedQuantity";

const CartButton = ({ value, item }: CartButtonProps) => {
  const { quantity, handleAdd, handleRemove } = useCartOperations(item, value);
  //console.log("cart button------>", item?._id);
  const cartButtonProductId = useSelector(
    (state: RootState) => state.cart.cartButtonProductId || []
  );
  const isLoading = cartButtonProductId.includes(item?._id);
  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          //opacity: isLoading ? 0.5 : 1,
          // pointerEvents: isLoading ? "none" : "auto",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            flex: 1,
          }}
        >
          {quantity > 0 ? (
            <TouchableOpacity
              onPress={() => {
                if (isLoading) {
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
              //disabled={isLoading}
            >
              <Image
                source={require("../../../assets/images/entypo_minus.png")}
                style={styles.icon}
                tintColor="white"
              />
            </TouchableOpacity>
          ) : null}
       

          {quantity > 0 && <AnimatedQuantity variant={2} quantity={quantity} />}

          {quantity > 0 ? (
            <TouchableOpacity
              onPress={() => {
                if (isLoading) {
                  showToast({
                    type: "info",
                    text2:
                      "Please wait a moment — we’re still updating your cart.",
                  });
                  return;
                }
                handleAdd();
              }}
              // disabled={isLoading}
              style={[styles.addButton]}
            >
              <Image
                source={require("../../../assets/images/entypo_plus.png")}
                style={styles.icon}
                tintColor="white"
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => {
                if (isLoading) {
                  showToast({
                    type: "info",
                    text2:
                      "Please wait a moment — we’re still updating your cart.",
                  });
                  return;
                }
                handleAdd();
              }}
              // disabled={isLoading}
              style={[styles.addToCartButton]}
            >
              {/* {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.addToCartText}>Add</Text>
              )} */}
              <Text style={styles.addToCartText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    width: "100%",
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: Colors.light.gradientGreen_1,
    alignItems: "center",
    justifyContent: "center",
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: "#ff6c6c",
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    width: 20,
    height: 20,
  },
  addToCartButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: Colors.light.gradientGreen_2,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    maxHeight: 40,
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    width: 40,
  },
});

export default memo(CartButton);
