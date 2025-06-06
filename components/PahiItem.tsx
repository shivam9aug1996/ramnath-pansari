import React, { memo } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const PahiItem = ({ index, currentIndex }) => {
  const getDotStyle = useAnimatedStyle(() => {
    const isActive = currentIndex.value === index; // Use .value to access shared value
    return {
      width: withTiming(isActive ? 12 : 8, {
        duration: 300,
        easing: Easing.linear,
      }),
      height: withTiming(isActive ? 12 : 8, {
        duration: 300,
        easing: Easing.linear,
      }),
      borderRadius: withTiming(6, { duration: 300 }),
      marginHorizontal: 5,
      backgroundColor: isActive ? "#4caf50" : "#aaa",
    };
  });

  return <Animated.View style={getDotStyle} />;
};

export default memo(PahiItem);
