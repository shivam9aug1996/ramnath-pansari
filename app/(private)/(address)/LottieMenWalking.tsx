// import { useState, useEffect, useRef } from "react";
// import LottieView from "lottie-react-native";
// import { Colors } from "@/constants/Colors";

// export default function LottieMenWalking() {
//   const [isVisible, setIsVisible] = useState(true); // State to control visibility
//   const animation = useRef<LottieView>(null);

//   useEffect(() => {
//     // Hide the animation after 2 seconds
//     const timer = setTimeout(() => {
//       setIsVisible(false); // Change the visibility to false after 2 seconds
//     }, 2000);

//     // Clear the timer if the component unmounts or if it's no longer needed
//     return () => clearTimeout(timer);
//   }, []);

//   if (!isVisible) return null; // Return null to hide the component

//   return (
//     <LottieView
//       autoPlay
//       ref={animation}
//       style={{
//         width: "100%",
//         height: "100%",
//         backgroundColor: Colors.light.background,
//       }}
//       source={{
//         uri: "https://res.cloudinary.com/dc2z2c3u8/raw/upload/v1732823539/delivery-guy_ljwyy3.json",
//       }}
//     />
//   );
// }

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
import { Keyboard } from "react-native";

export default function LottieMenWalking() {
  const [isVisible, setIsVisible] = useState(true);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Dismiss the keyboard after 100ms
    const keyboardDismissTimer = setTimeout(() => {
      Keyboard.dismiss();
    }, 100);

    return () => clearTimeout(keyboardDismissTimer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(
        0,
        { duration: 1000, easing: Easing.ease },
        () => {
          runOnJS(setIsVisible)(false);
        }
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        { width: "100%", height: "100%", zIndex: 9999999 },
        animatedStyle,
      ]}
    >
      <LottieView
        autoPlay
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: Colors.light.background,
        }}
        source={{
          uri: "https://res.cloudinary.com/dc2z2c3u8/raw/upload/v1732823539/delivery-guy_ljwyy3.json",
        }}
      />
    </Animated.View>
  );
}
