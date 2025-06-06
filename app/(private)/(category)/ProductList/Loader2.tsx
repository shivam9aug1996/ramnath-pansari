import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming 
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

const LoadingDots = () => {
  const dot1Scale = useSharedValue(1);
  const dot2Scale = useSharedValue(1);
  const dot3Scale = useSharedValue(1);

  useEffect(() => {
    // First dot animation
    dot1Scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 400 }),
        withTiming(1, { duration: 400 })
      ),
      -1,
      true
    );

    // Second dot animation with delay
    setTimeout(() => {
      dot2Scale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        true
      );
    }, 200);

    // Third dot animation with delay
    setTimeout(() => {
      dot3Scale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        true
      );
    }, 400);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot1Scale.value }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot2Scale.value }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot3Scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, dot1Style]} />
      <Animated.View style={[styles.dot, dot2Style]} />
      <Animated.View style={[styles.dot, dot3Style]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.mediumGreen,
  },
});

export default LoadingDots;