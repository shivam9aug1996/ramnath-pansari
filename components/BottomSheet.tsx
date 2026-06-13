import React, { useEffect, useMemo } from "react";
import { Dimensions, Platform, Pressable, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector, ScrollView } from "react-native-gesture-handler";
import { BlurView } from "expo-blur";
import { ThemedView } from "@/components/ThemedView";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BottomSheetProps {
  children: React.ReactNode;
  onClose?: () => void;
  staticContent?: React.ReactNode;
  animation?: boolean;
  wrapperStyle?: ViewStyle;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  children,
  onClose,
  staticContent,
  animation = true,
  wrapperStyle = {},
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const startY = useSharedValue(0);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(animation)
        .onStart(() => {
          startY.value = translateY.value;
        })
        .onUpdate((event) => {
          translateY.value = startY.value + event.translationY;
        })
        .onEnd((event) => {
          if (event.translationY > SCREEN_HEIGHT / 5) {
            if (onClose) {
              runOnJS(onClose)();
            }
            translateY.value = withSpring(onClose ? SCREEN_HEIGHT : 0);
          } else {
            translateY.value = withSpring(0);
          }
        }),
    [animation, onClose]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: !animation ? 0 : translateY.value }],
  }));

  useEffect(() => {
    translateY.value = withSpring(0);
  }, []);

  return (
    <>
      <BlurView
        experimentalBlurMethod="dimezisBlurView"
        intensity={20}
        style={styles.blurView}
        tint={"dark"}
      />
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.container, wrapperStyle, animatedStyle]}>
          <Pressable
            onPress={() => {
              onClose?.();
            }}
            style={{ flex: 1.2 }}
          />
          <ThemedView style={styles.ellipseContainer}>
            <ThemedView style={styles.ellipse} />
          </ThemedView>
          <ThemedView style={{ flex: 1 }}>
            <ScrollView
              bounces={Platform.OS === "android" ? false : true}
              style={{ height: "30%" }}
            >
              {children}
            </ScrollView>
            {staticContent}
          </ThemedView>
        </Animated.View>
      </GestureDetector>
    </>
  );
};

export default BottomSheet;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  ellipseContainer: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  ellipse: {
    width: Dimensions.get("screen").width / 2,
    height: 200,
    borderRadius: 100,
    transform: [{ scaleX: 4 }],
  },
  blurView: {
    position: "absolute",
    flex: 1,
    width: "100%",
    height: "100%",
  },
});
