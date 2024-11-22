import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";

import { Colors } from "@/constants/Colors";

import { CartButtonProps } from "@/types/global";

import { useCartOperations } from "../../hooks/useCartOperations";
import Animation from "./Animation";

const CartButton = ({ value, item }: CartButtonProps) => {
  const { quantity, handleAdd, handleRemove } = useCartOperations(item, value);

  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: quantity > 0 ? "space-between" : "flex-end",
        }}
      >
        {quantity > 0 && (
          <TouchableOpacity
            onPress={handleRemove}
            style={[styles.removeButton]}
          >
            <Image
              source={require("../../../../assets/images/entypo_minus.png")}
              style={styles.icon}
              tintColor="white"
            />
          </TouchableOpacity>
        )}
        {quantity > 0 && (
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityText}>{quantity}</Text>
          </View>
        )}
        <TouchableOpacity onPress={handleAdd} style={[styles.addButton]}>
          <Image
            source={require("../../../../assets/images/entypo_plus.png")}
            style={styles.icon}
            tintColor="white"
          />
        </TouchableOpacity>
      </View>
      <Animation id={item?._id} />
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