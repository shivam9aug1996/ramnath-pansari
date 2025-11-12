import { useEffect } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

export const useSlideFadeIn = ({
  fromY = 100,
  duration = 500,
  delay = 0,
} = {}) => {
  const translateY = useSharedValue(fromY);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      translateY.value = withTiming(0, {
        duration,
        easing: Easing.out(Easing.exp),
      });
      opacity.value = withTiming(1, { duration });
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return animatedStyle;
};
