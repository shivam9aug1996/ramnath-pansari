import React, { useRef, useEffect } from "react";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, StyleSheet, Alert } from "react-native";

const ConfettiLottie = ({
  source = require("../assets/lottie/confetti.json"),
  loop = false,
  style = {},
  remainingAmount,
}) => {
  const animationRef = useRef(null);

  useEffect(() => {
    const checkAndPlayAnimation = async () => {
        
      try {
        const prevAmountStr = await AsyncStorage.getItem("prevRemainingAmount");
        const prevAmount =
          prevAmountStr !== null ? Number(prevAmountStr) : undefined;

        // Only play when value changes
        if (prevAmount !== remainingAmount) {
          if (remainingAmount !== undefined && remainingAmount <= 0) {
            console.log("play animation7654567890");
            animationRef.current?.play();
          } else {
            animationRef.current?.reset();
          }
        }

        await AsyncStorage.setItem(
          "prevRemainingAmount",
          String(remainingAmount)
        );
      } catch (err) {
        console.log("Error handling animation state:", err);
      }
    };

    checkAndPlayAnimation();

    return () => {
      animationRef.current?.reset();
    };
  }, [remainingAmount]);

  return (
    <View style={styles.container}>
      <LottieView
        loop={loop}
        onAnimationFinish={() => {
          animationRef.current?.reset();
        }}
        ref={animationRef}
        source={source}
        autoPlay={false}
        style={[styles.animation, style]}
        
      />
    </View>
  );
};

export default ConfettiLottie;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "90%",
    zIndex: 1, // ensure it's on top
    pointerEvents: "none", // let touches pass through,
    overflow:"hidden",
    //backgroundColor:"red",
    
   
  },
  animation: {
    width: "100%",
    height: "800%",

   // backgroundColor:"red"
    
  },
});
