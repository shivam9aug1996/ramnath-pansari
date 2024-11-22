import { StyleSheet, TouchableOpacity, View } from "react-native";
import React, { memo } from "react";
import { Colors } from "@/constants/Colors";
import { Image } from "expo-image";
import { ThemedText } from "../ThemedText";
import { useCartOperations } from "@/app/(private)/hooks/useCartOperations";
import Animation from "./Animation";

const CartButton = ({ item, value, itemHeight }: any) => {
  const { quantity, handleAdd, handleRemove, handleClearAll } =
    useCartOperations(item?.productDetails, value);

  return (
    <>
      <Animation
        itemHeight={itemHeight}
        id={item?.productDetails?._id}
        handleClearAll={handleClearAll}
      />

      <View style={styles.quantityContainer}>
        <TouchableOpacity onPress={handleRemove} style={styles.quantityButton}>
          <Image
            source={require("../../assets/images/entypo_minus.png")}
            style={styles.icon}
          />
        </TouchableOpacity>
        <ThemedText style={styles.quantityText}>{quantity}</ThemedText>
        <TouchableOpacity onPress={handleAdd} style={styles.quantityButton}>
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
    flex: 0.7,
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
  quantityText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 20,
    color: Colors.light.mediumGrey,
    marginHorizontal: 10,
  },
});
