import { StyleSheet, TouchableOpacity, View } from "react-native";
import React, { memo } from "react";
import { Image } from "expo-image";
import { useCartOperations } from "@/app/(private)/hooks/useCartOperations";
import AnimatedQuantity from "@/app/(private)/(category)/ProductList/AnimatedQuantity";

const CartButton = ({ item, value }: any) => {
  const { quantity, handleAdd, handleRemove } = useCartOperations(
    item?.productDetails,
    value,
  );

  return (
    <View style={styles.quantityContainer}>
      <TouchableOpacity onPress={handleRemove} style={styles.quantityButton}>
        <Image
          source={require("../../assets/images/entypo_minus.png")}
          style={styles.icon}
        />
      </TouchableOpacity>
      <AnimatedQuantity variant={3} quantity={quantity} />
      <TouchableOpacity onPress={handleAdd} style={styles.quantityButton}>
        <Image
          source={require("../../assets/images/entypo_plus.png")}
          style={styles.icon}
        />
      </TouchableOpacity>
    </View>
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
