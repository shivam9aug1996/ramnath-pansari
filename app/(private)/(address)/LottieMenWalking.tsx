import React, { useState, useEffect } from "react";
import LottieView from "lottie-react-native";
import Animated, {
  Easing,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";
import { Colors } from "@/constants/Colors";
import { Keyboard, View } from "react-native";

export default function LottieMenWalking() {
  const [isVisible, setIsVisible] = useState(true);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Dismiss the keyboard after 100ms
    const keyboardDismissTimer = setTimeout(() => {
      Keyboard.dismiss();
    }, 100);
    const keyboardDismissTimer2 = setTimeout(() => {
      setIsVisible(false);
    }, 1500);

    return () => {
      clearTimeout(keyboardDismissTimer);
      clearTimeout(keyboardDismissTimer2);
    };
  }, []);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     opacity.value = withTiming(
  //       0,
  //       { duration: 1000, easing: Easing.ease },
  //       () => {
  //         runOnJS(setIsVisible)(false);
  //       }
  //     );
  //   }, 1000);

  //   return () => clearTimeout(timer);
  // }, [opacity]);

  // const animatedStyle = useAnimatedStyle(() => {
  //   return {
  //     opacity: opacity.value,
  //   };
  // });

  if (!isVisible) return null;

  return (
    <View
      style={[
        { width: "100%", height: "100%", zIndex: 9999999 },
        // animatedStyle,
      ]}
    >
      <LottieView
        autoPlay
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: Colors.light.background,
        }}
        // source={{
        //   uri: "https://res.cloudinary.com/dc2z2c3u8/raw/upload/v1732823539/delivery-guy_ljwyy3.json",
        // }}
        source={require("../../../assets/lottie/delivery.json")}
      />
    </View>
  );
}
