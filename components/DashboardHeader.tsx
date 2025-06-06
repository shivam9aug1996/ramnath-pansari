import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { memo } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Colors } from "@/constants/Colors";

const DashboardHeader = ({ userName, profileImage, onProfilePress }) => {
  // const rotateValue = useSharedValue(0);

  // React.useEffect(() => {
  //   rotateValue.value = withRepeat(
  //     withTiming(50, { duration: 600, easing: Easing.ease }),
  //     4, // Infinite repetition
  //     true // Reverse direction for a waving effect
  //   );
  // }, [rotateValue]);

  // // useEffect(() => {
  // //   StatusBar.setStatusBarBackgroundColor("red");
  // // }, []);

  // const animatedStyle = useAnimatedStyle(() => {
  //   return {
  //     transform: [{ rotate: `${rotateValue.value}deg` }],
  //   };
  // });

  return (
    <View style={styles.headerContainer}>
      <View style={{ flex: 2 }}>
        <Text style={styles.greetingText}>
          {`Hey ${userName} `}
          {/* <Animated.View style={[animatedStyle]}>
            <Text style={{ fontSize: 18 }}>👋</Text>
          </Animated.View> */}
        </Text>
      </View>
      <TouchableOpacity
        style={{ flex: 1, alignItems: "flex-end" }}
        onPress={onProfilePress}
      >
        <Image
          borderRadius={25}
          width={50}
          height={50}
          source={{
            uri:
              profileImage ||
              "https://static.vecteezy.com/system/resources/previews/036/594/092/non_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg",
          }}
        />
      </TouchableOpacity>
    </View>
  );
};

export default memo(DashboardHeader);

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingText: {
    fontFamily: "Raleway_800ExtraBold",
    fontSize: 22,
    color: Colors.light.darkGreen,
    marginBottom: 3,
  },
});
