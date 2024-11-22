import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";

import { Colors } from "@/constants/Colors";
import { CartButtonProps, RootState } from "@/types/global";
import { useCartOperations } from "../hooks/useCartOperations";
import { useSelector } from "react-redux";
import Animation from "./Animation";

const CartButton = ({ value, item }: CartButtonProps) => {
  const { quantity, handleAdd, handleRemove } = useCartOperations(item, value);
  console.log("cart button------>", item?._id);
  const cartButtonProductId = useSelector(
    (state: RootState) => state.cart.cartButtonProductId || []
  );
  const isLoading = cartButtonProductId.includes(item?._id);
  return (
    <View style={styles.container}>
      {/* <Animation id={item?._id} /> */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          opacity: isLoading ? 0.5 : 1,
          pointerEvents: isLoading ? "none" : "auto",
        }}
      >
        {/* {quantity > 0 ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              flex: 1,
            }}
          >
            <TouchableOpacity
              onPress={handleRemove}
              style={[styles.removeButton, styles.buttonShadow]}
            >
              <Image
                source={require("../../../assets/images/entypo_minus.png")}
                style={styles.icon}
                tintColor="white"
              />
            </TouchableOpacity>
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityText}>{quantity}</Text>
            </View>
            <TouchableOpacity
              onPress={handleAdd}
              style={[styles.addButton, styles.buttonShadow]}
            >
              <Image
                source={require("../../../assets/images/entypo_plus.png")}
                style={styles.icon}
                tintColor="white"
              />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.addToCartButton, styles.buttonShadow]}
          >
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        )} */}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            flex: 1,
          }}
        >
          {quantity > 0 ? (
            <TouchableOpacity
              onPress={handleRemove}
              style={[styles.removeButton, styles.buttonShadow]}
            >
              <Image
                source={require("../../../assets/images/entypo_minus.png")}
                style={styles.icon}
                tintColor="white"
              />
            </TouchableOpacity>
          ) : null}
          {quantity > 0 ? (
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityText}>{quantity}</Text>
            </View>
          ) : null}

          {quantity > 0 ? (
            <TouchableOpacity
              onPress={handleAdd}
              style={[styles.addButton, styles.buttonShadow]}
            >
              <Image
                source={require("../../../assets/images/entypo_plus.png")}
                style={styles.icon}
                tintColor="white"
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleAdd}
              style={[styles.addToCartButton, styles.buttonShadow]}
            >
              <Text style={styles.addToCartText}>Add</Text>
            </TouchableOpacity>
            // <TouchableOpacity
            //   onPress={handleAdd}
            //   style={[styles.addButton, styles.buttonShadow]}
            // >
            //   <Image
            //     source={require("../../../assets/images/entypo_plus.png")}
            //     style={styles.icon}
            //     tintColor="white"
            //   />
            // </TouchableOpacity>
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
    right: 0,
    // padding: 15,
    // flex: 1,
    // backgroundColor: Colors.light.white,
    // borderRadius: 20,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 6,
    // elevation: 4,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: Colors.light.gradientGreen_1,
    alignItems: "center",
    justifyContent: "center",
  },
  removeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: Colors.light.lightRed,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityContainer: {
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: Colors.light.darkGreen,
  },
  icon: {
    width: 24,
    height: 24,
  },
  buttonShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  addToCartButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: Colors.light.gradientGreen_2,
    alignItems: "center",
    justifyContent: "center",
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
});

export default memo(CartButton);
