import React, { memo, ReactNode, useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { StyleProp, ViewStyle } from "react-native";
type Direction = "up" | "down" | "left" | "right" | "none";

type Props = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  fade?: boolean;
  slide?: Direction;
  style?: StyleProp<ViewStyle>;
};

const FadeSlideIn = ({
  children,
  delay = 0,
  duration = 300,
  distance = 20,
  fade = true,
  slide = "up",
  style = {},
}: Props) => {
  const opacity = useSharedValue(fade ? 0 : 1);
  const translateX = useSharedValue(
    slide === "left" ? distance : slide === "right" ? -distance : 0
  );
  const translateY = useSharedValue(
    slide === "up" ? distance : slide === "down" ? -distance : 0
  );

  useEffect(() => {
    if (fade) {
      opacity.value = withTiming(1, { duration, delay });
    }
    translateX.value = withTiming(0, { duration, delay });
    translateY.value = withTiming(0, { duration, delay });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
};

export default memo(FadeSlideIn);
