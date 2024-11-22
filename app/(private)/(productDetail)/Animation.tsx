import { Colors } from "@/constants/Colors";
import { RootState } from "@/types/global";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSelector } from "react-redux";

const Animation = ({ id }: any) => {
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

  if (!isLoading) return null;

  return (
    <Animated.View style={[animatedStyle, styles.updateContainer]}>
      <View style={{ flexDirection: "row" }}>
        <Text style={{ fontFamily: "Raleway_500Medium" }}>Updating...</Text>
        <ActivityIndicator size={"small"} />
      </View>
    </Animated.View>
  );
};

export default Animation;

const styles = StyleSheet.create({
  updateContainer: {
    //backgroundColor: "#f0f0f019",
    position: "absolute",
    width: "100%",
    // height: 60,
    bottom: 0,
    borderBottomRightRadius: 28,
    borderBottomLeftRadius: 28,
    justifyContent: "center",
    alignItems: "flex-end",
    zIndex: 700,
    top: 0,
  },
});
