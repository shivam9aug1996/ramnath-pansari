// import React, { useEffect, useRef, useState, ReactNode } from 'react';
// import { Platform, StyleProp, View, ViewStyle } from 'react-native';
// import { InteractionManager } from 'react-native';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withTiming,
//   cancelAnimation,
// } from 'react-native-reanimated';

// interface DeferredFadeInProps {
//   children: ReactNode;
//   delay?: number;
//   duration?: number;
//   style?: StyleProp<ViewStyle>;
//   fallback?: ReactNode;
// }

// const DeferredFadeIn: React.FC<DeferredFadeInProps> = ({
//   children,
//   delay = 0,
//   duration = 300,
//   style = { flexShrink: 1, alignSelf: 'stretch' },
//   fallback = null,
// }) => {
//   const [shouldRender, setShouldRender] = useState(false);
//   const opacity = useSharedValue(0);

//   const isMounted = useRef(true);
//   const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const task = useRef<ReturnType<typeof InteractionManager.runAfterInteractions> | null>(null);

//   useEffect(() => {
//     isMounted.current = true;

//     task.current = InteractionManager.runAfterInteractions(() => {
//       timeoutId.current = setTimeout(() => {
//         if (isMounted.current) {
//           setShouldRender(true);
//           opacity.value = withTiming(1, { duration });
//         }
//       }, delay);
//     });

//     return () => {
//       isMounted.current = false;
//       if (timeoutId.current) clearTimeout(timeoutId.current);
//       if (task.current) task.current.cancel();

//       cancelAnimation(opacity);
//     };
//   }, [delay, duration, opacity]);

//   const animatedStyle = useAnimatedStyle(() => ({
//     opacity: opacity.value,
//   }));

//   if (!shouldRender) {
//     return fallback ?? null;
//   }

//   if (Platform.OS === 'android') {
//     return (
//       <View style={[animatedStyle, style]}>
//         {children}
//       </View>
//     );
//   }

//   return (
//     <Animated.View style={[animatedStyle, style]}>
//       {children}
//     </Animated.View>
//   );
// };

// export default DeferredFadeIn;



import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

interface DeferredFadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  fallback?: ReactNode;
}

const DeferredFadeIn: React.FC<DeferredFadeInProps> = ({
  children,
  delay = 0,
  duration = 300,
  style = { flexShrink: 1, alignSelf: 'stretch' },
  fallback = null,
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const opacity = useSharedValue(0);

  const isMounted = useRef(true);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameId = useRef<number | null>(null);

  useEffect(() => {
    if (__DEV__) {
      setShouldRender(true);
      opacity.value = 1;
      return;
    }

    isMounted.current = true;

    frameId.current = requestAnimationFrame(() => {
      timeoutId.current = setTimeout(() => {
        if (isMounted.current) {
          setShouldRender(true);
          opacity.value = withTiming(1, { duration });
        }
      }, delay);
    });

    return () => {
      isMounted.current = false;
      if (timeoutId.current) clearTimeout(timeoutId.current);
      if (frameId.current) cancelAnimationFrame(frameId.current);
      cancelAnimation(opacity);
    };
  }, [delay, duration, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!shouldRender) {
    return fallback ?? null;
  }

  if (Platform.OS === 'android') {
    return <View style={[animatedStyle, style]}>{children}</View>;
  }

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
};

export default DeferredFadeIn;
