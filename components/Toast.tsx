import React from "react";
import { StyleSheet } from "react-native";
import ToastManager from "toastify-react-native";
import { fonts } from "@/constants/Fonts";
import { Colors } from "@/constants/Colors";

const Toast: React.FC = () => {
  return (
    <ToastManager
      style={styles.container}
      textStyle={styles.text}
      position="top"
      duration={2000}
    />
  );
};

export default Toast;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  text: {
    ...fonts.defaultRegular,
    fontSize: 14,
    color: Colors.light.white,
    marginRight: 50,
  },
});
