import { useEffect } from "react";
import { useSharedValue, withTiming } from "react-native-reanimated";

export function useAnimatedToggle(show: boolean, duration = 500) {
  const opacity = useSharedValue(show ? 1 : 0);
  const translateY = useSharedValue(show ? 0 : 20); // slide up/down

  useEffect(() => {
    opacity.value = withTiming(show ? 1 : 0, { duration });
    translateY.value = withTiming(show ? 0 : 20, { duration });
  }, [show]);

  return { opacity, translateY };
}
