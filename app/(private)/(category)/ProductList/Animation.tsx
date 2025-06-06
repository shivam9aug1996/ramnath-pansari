import { Colors } from "@/constants/Colors";
import { RootState } from "@/types/global";
import React, { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  useSharedValue,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import { ThemedText } from "@/components/ThemedText";
import { Text } from "react-native";

interface AnimationProps {
  id: string;
  isOutOfStock?: boolean;
}

const Animation: React.FC<AnimationProps> = ({ id, isOutOfStock = false }) => {
  const cartButtonProductId = useSelector(
    (state: RootState) => state.cart.cartButtonProductId || []
  );
  
  const isLoading = cartButtonProductId.includes(id);
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
        translateY: withSpring(isLoading ? 0 : 60, {
          damping: 25,
          stiffness: 90,
        }),
      },
    ],
    opacity: withTiming(isLoading ? 1 : 0, { duration: 200 }),
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

  if (isOutOfStock) {
    return (
      <Animated.View
        style={[
          styles.container,
          styles.outOfStockContainer,
          { transform: [{ translateY: 0 }] },
        ]}
      >
        <View style={styles.contentWrapper}>
          <ThemedText style={styles.outOfStockText}>Out of stock</ThemedText>
        </View>
      </Animated.View>
    );
  }

  if (!isLoading) return null;

  // return <View style={{flex:1, justifyContent:"center", alignItems:"center",position:"absolute",top:-50,backgroundColor:"red"}}>
  //   <Text>kjhgf</Text>
  // </View>

  return (
    <Animated.View style={[slideAnimation, styles.container]}>
      <View style={styles.contentWrapper}>
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
  container: {
    backgroundColor: Colors.light.softGrey_1,
    position: "absolute",
    width: "100%",
    height: 60,
    bottom: 0,
    borderBottomRightRadius: 28,
    borderBottomLeftRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 700,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  outOfStockContainer: {
    backgroundColor: Colors.light.softGrey_2,
  },
  contentWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 0,
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
  outOfStockText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 13,
    color: Colors.light.darkGrey,
    letterSpacing: 0.3,
  },
});
