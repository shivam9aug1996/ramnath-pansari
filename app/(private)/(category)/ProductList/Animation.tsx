import { Colors } from "@/constants/Colors";
import { RootState } from "@/types/global";
import React from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSelector } from "react-redux";

const Animation = ({ id, isOutOfStock = false }: any) => {
  const cartButtonProductId = useSelector(
    (state: RootState) => state.cart.cartButtonProductId || []
  );
  const isLoading = cartButtonProductId.includes(id);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(isLoading ? 0 : 60, {
            duration: 300,
          }),
        },
      ],
    };
  }, [isLoading]);

  if (isOutOfStock) {
    return (
      <Animated.View
        style={[
          {
            transform: [
              {
                translateY: 0,
              },
            ],
          },
          styles.updateContainer,
        ]}
      >
        <Text style={{ fontFamily: "Raleway_500Medium" }}>Out of stock</Text>
      </Animated.View>
    );
  }

  if (!isLoading) return null;

  return (
    <Animated.View style={[animatedStyle, styles.updateContainer]}>
      <Text style={{ fontFamily: "Raleway_500Medium" }}>Updating...</Text>
    </Animated.View>
  );
};

export default Animation;

const styles = StyleSheet.create({
  updateContainer: {
    backgroundColor: Colors.light.lightGrey,
    position: "absolute",
    width: "100%",
    height: 60,
    bottom: 0,
    borderBottomRightRadius: 28,
    borderBottomLeftRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 700,
  },
});
