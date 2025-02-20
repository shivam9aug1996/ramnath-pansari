import { StyleSheet, TouchableOpacity, View } from "react-native";
import React, { memo, useEffect } from "react";
import { Colors } from "@/constants/Colors";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  useSharedValue,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { Entypo } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";

interface AnimationProps {
  itemHeight: number;
  id: string;
  handleClearAll: () => void;
  buttonClicked?: React.RefObject<boolean>;
}

const Animation: React.FC<AnimationProps> = ({
  itemHeight,
  id,
  handleClearAll,
  buttonClicked,
}) => {
  const cartButtonProductId = useSelector(
    (state: RootState) => state.cart.cartButtonProductId
  );

  const isLoading = cartButtonProductId?.includes(id);
  const dot1Scale = useSharedValue(1);
  const dot2Scale = useSharedValue(1);
  const dot3Scale = useSharedValue(1);

  useEffect(() => {
    if (isLoading) {
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
    }
  }, [isLoading]);

  const slideAnimation = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSequence(
          withSpring(isLoading ? 0 : 70, {
            damping: 12,
            stiffness: 90,
          })
        ),
      },
    ],
    opacity: withTiming(isLoading ? 1 : 0.95, {
      duration: 200,
    }),
  }));

  const dot1Animation = useAnimatedStyle(() => ({
    transform: [{ scale: dot1Scale.value }],
  }));

  const dot2Animation = useAnimatedStyle(() => ({
    transform: [{ scale: dot2Scale.value }],
  }));

  const dot3Animation = useAnimatedStyle(() => ({
    transform: [{ scale: dot3Scale.value }],
  }));

  if (!isLoading) {
    return (
      <TouchableOpacity
        style={styles.deleteButtonWrapper}
        onPress={handleClearAll}
        disabled={buttonClicked?.current}
        activeOpacity={0.7}
      >
        <Animated.View style={[styles.deleteButton]}>
          <View style={styles.deleteIconWrapper}>
            <Entypo
              name="circle-with-cross"
              size={20}
              color={Colors.light.lightRed}
            />
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      style={[slideAnimation, styles.updateContainer, { height: itemHeight }]}
    >
      <View style={styles.loadingContent}>
        <ThemedText style={styles.updateText}>Updating</ThemedText>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.loadingDot, dot1Animation]} />
          <Animated.View style={[styles.loadingDot, dot2Animation]} />
          <Animated.View style={[styles.loadingDot, dot3Animation]} />
        </View>
      </View>
    </Animated.View>
  );
};

export default memo(Animation);

const styles = StyleSheet.create({
  deleteButtonWrapper: {
    position: "absolute",
    right: 0,
    top: -5,
    zIndex: 10,
  },
  deleteButton: {
    backgroundColor: Colors.light.softGrey_1,
    padding: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  deleteIconWrapper: {
    backgroundColor: 'rgba(236, 83, 74, 0.1)',
    padding: 4,
    borderRadius: 16,
  },
  updateContainer: {
    width: "50%",
    zIndex: 700,
    position: "absolute",
    backgroundColor: Colors.light.softGrey_1,
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 23,
    borderBottomRightRadius: 23,
    right: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(42, 175, 127, 0.08)',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 2,
  },
  loadingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.mediumGreen,
    opacity: 0.7,
  },
  updateText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 13,
    color: Colors.light.mediumGreen,
    letterSpacing: 0.3,
  },
});
