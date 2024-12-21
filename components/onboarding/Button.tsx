import { Image, StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import { ThemedView } from "../ThemedView";
import { Colors } from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";

const Button = ({ handlePress }) => {
  return (
    <ThemedView style={styles.outerButtonBorder}>
      <TouchableOpacity onPress={handlePress}>
        <LinearGradient
          colors={[Colors.light.gradientGreen_2, Colors.light.gradientGreen_1]}
          style={[styles.button]}
        >
          <Image
            tintColor={Colors.light.white}
            source={require("../../assets/images/bi_arrow-right.png")}
            style={{ width: 30, height: 30 }}
          />
        </LinearGradient>
      </TouchableOpacity>
    </ThemedView>
  );
};

export default Button;

const styles = StyleSheet.create({
  button: {
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 61,
    paddingVertical: 25,
  },
  outerButtonBorder: {
    backgroundColor: "transparent",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(43, 175, 111, 0.3)",
  },
});
