import { Image, StyleSheet, Text, View } from "react-native";
import React from "react";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import { fonts } from "@/constants/Fonts";
import { Colors } from "@/constants/Colors";

const CartButton = () => {
  return (
    <ThemedView style={{ flexDirection: "row" }}>
      <Image
        source={require("../../assets/images/entypo_plus.png")}
        style={{ width: 20, height: 20 }}
      />
      <ThemedText
        style={{
          fontFamily: fonts.defaultNumber as any,
          fontSize: 20,
          color: Colors.light.mediumGrey,
        }}
      >
        3
      </ThemedText>
      <Image
        source={require("../../assets/images/entypo_minus.png")}
        style={{ width: 20, height: 20 }}
      />
    </ThemedView>
  );
};

export default CartButton;

const styles = StyleSheet.create({});
