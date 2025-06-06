import React from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useAnimatedToggle } from "@/hooks/useAnimatedToggle"; // 👈 your hook

type Props = {
  show: boolean;
  children: React.ReactNode;
  duration?: number;
};

const FadeSlideToggle = ({ show, children, duration = 500 }: Props) => {
  const { opacity, translateY } = useAnimatedToggle(show, duration);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

export default FadeSlideToggle;
