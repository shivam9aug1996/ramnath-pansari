import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedGestureHandler,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { PanGestureHandler, ScrollView } from "react-native-gesture-handler";
import { BlurView } from "expo-blur";
import { ThemedView } from "@/components/ThemedView";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
interface BottomSheetProps {
  children: React.ReactNode;
  onClose?: () => void;
  staticContent?: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  children,
  onClose,
  staticContent,
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx: any) => {
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: (event) => {
      if (event.translationY > SCREEN_HEIGHT / 6) {
        translateY.value = withSpring(onClose ? SCREEN_HEIGHT : 0, {}, () => {
          if (onClose) {
            runOnJS(onClose)?.();
          }
        });
      } else {
        translateY.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

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
      ></BlurView>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <View style={{ flex: 1.2 }}></View>
          <ThemedView style={styles.ellipseContainer}>
            <ThemedView style={styles.ellipse} />
          </ThemedView>
          <ThemedView style={{ flex: 1 }}>
            <ScrollView style={{ height: "30%" }}>{children}</ScrollView>
            {staticContent}
          </ThemedView>
        </Animated.View>
      </PanGestureHandler>
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
