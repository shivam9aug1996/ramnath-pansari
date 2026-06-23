import React, { ReactNode, useEffect, useState } from "react";
import { InteractionManager, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface DeferredFadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  fallback?: ReactNode;
}
let simulateProduction = false

const DeferredFadeIn = ({
  children,
  delay = 0,
  duration = 250,
  style,
  fallback = null,
}: DeferredFadeInProps) => {
  const [mounted, setMounted] = useState(simulateProduction);
  const opacity = useSharedValue(simulateProduction ? 1 : 0);

  // Step 1: wait until navigation/interactions finish
  useEffect(() => {
    if (simulateProduction) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const task = InteractionManager.runAfterInteractions(() => {
      timer = setTimeout(() => {
        if (!cancelled) {
          setMounted(true);
        }
      }, delay);
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      task.cancel();
    };
  }, [delay]);

  // Step 2: animate after mount
  useEffect(() => {
    if (!mounted) return;

    opacity.value = 0;
    opacity.value = withTiming(1, { duration });
  }, [mounted, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!mounted) {
    return <>{fallback}</>;
  }

  return (
    <Animated.View style={[{ flexShrink: 1 }, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

export default DeferredFadeIn;