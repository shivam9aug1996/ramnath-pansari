import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { memo, useMemo } from "react";
import { Colors } from "@/constants/Colors";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { Entypo } from "@expo/vector-icons";

interface AnimationProps {
  itemHeight: number;
  id: string;
  handleClearAll: any;
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

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateX: withTiming(isLoading ? 0 : 70, {
            duration: 300,
          }),
        },
      ],
    }),
    [isLoading]
  );

  if (!isLoading)
    return (
      <TouchableOpacity
        style={{
          position: "absolute",
          right: 0,
          top: -5,
          // backgroundColor: "red",
          paddingLeft: 10,
          paddingBottom: 10,
        }}
        onPress={handleClearAll}
        disabled={buttonClicked?.current}
      >
        <Entypo
          name="circle-with-cross"
          size={24}
          color={Colors.light.lightGreen}
        />
      </TouchableOpacity>
    );

  return (
    <Animated.View
      style={[animatedStyle, styles.updateContainer, { height: itemHeight }]}
    >
      <Text style={{ fontFamily: "Raleway_500Medium" }}>Updating...</Text>
    </Animated.View>
  );
};

export default memo(Animation);

const styles = StyleSheet.create({
  updateContainer: {
    width: "50%",
    zIndex: 700,
    position: "absolute",
    backgroundColor: Colors.light.lightGrey,
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 23,
    borderBottomRightRadius: 23,
    right: 0,
  },
});
