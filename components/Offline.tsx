import { StyleSheet, Text, View } from "react-native";
import React from "react";
import LottieView from "lottie-react-native";
import { Colors } from "@/constants/Colors";

const Offline = () => {
  return (
    <View
      style={[
        { width: "100%", height: "100%", zIndex: 9999999 },
        // animatedStyle,
      ]}
    >
      <LottieView
        autoPlay={true}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: Colors.light.background,
        }}
        // source={{
        //   uri: "https://res.cloudinary.com/dc2z2c3u8/raw/upload/v1732823539/delivery-guy_ljwyy3.json",
        // }}
        source={{
          uri: "https://res.cloudinary.com/dc2z2c3u8/raw/upload/v1736529398/Animation_-_1736528634266_cfgpcl.json",
        }}
      />
    </View>
  );
};

export default Offline;

const styles = StyleSheet.create({});
