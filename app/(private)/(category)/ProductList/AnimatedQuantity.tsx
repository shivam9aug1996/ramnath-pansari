import React, { memo, useEffect, useRef } from "react";
import { Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Colors } from "@/constants/Colors"; // adjust import as needed

type AnimatedQuantityProps = {
  quantity: number;
  variant?: 1 | 2 | 3;
};

const AnimatedQuantity = ({ quantity, variant = 1 }: AnimatedQuantityProps) => {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    opacity.value = 0;
    translateY.value = 10;

    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withTiming(0, { duration: 200 });
  }, [quantity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Select styles based on variant
  const containerStyle = variant === 1 ? styles.quantityContainer1 : variant === 2 ? styles.quantityContainer2 : styles.quantityContainer3;
  const textStyle = variant === 1 ? styles.quantityText1 : variant === 2 ? styles.quantityText2 : styles.quantityText3;

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <Text style={textStyle} accessibilityLabel={`Quantity: ${quantity}`}>
        {quantity}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  quantityContainer1: {
    alignSelf: "center",
    paddingBottom: 5,
    fontFamily: "Montserrat_500Medium",
  } as ViewStyle,

  quantityText1: {
    fontSize: 20,
  } as TextStyle,

  // Variant 2 styles
  quantityContainer2: {
    justifyContent: "center",
    paddingHorizontal: 12,
    width: 30,
    height: 30,
    alignItems: "center",
  } as ViewStyle,

  quantityText2: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    color: Colors.light.darkGreen,
    width: 30,
    height: 30,
    lineHeight: 30,
  } as TextStyle,   
  quantityContainer3: {
  } as ViewStyle,
  quantityText3: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 20,
    color: Colors.light.mediumGrey,
    marginHorizontal: 10,
  } as TextStyle,
});

export default memo(AnimatedQuantity);
