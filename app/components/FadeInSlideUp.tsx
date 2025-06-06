import React, { ReactNode, useEffect } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

type Props = {
  children: ReactNode;
  delay?: number;
  distance?: number;
};

const FadeInSlideUp = ({ children, delay = 0, distance = 20 }: Props) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(distance);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300, delay });
    translateY.value = withTiming(0, { duration: 300, delay });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

export default FadeInSlideUp;
