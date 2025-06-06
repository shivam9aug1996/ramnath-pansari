import React from "react";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  SlideInDown,
  SlideOutUp,
  ZoomIn,
  ZoomOut,
} from "react-native-reanimated";

type Props = {
  children: React.ReactNode;
  slide?: "up" | "down" | "none";
  fade?: boolean;
  zoom?: boolean;
  duration?: number;
};

const FadeSlideInOut = ({
  children,
  slide = "up",
  fade = true,
  zoom = false,
  duration = 500,
}: Props) => {
  let entering;
  let exiting;

  // Enter Anim
  if (slide === "up") {
    entering = SlideInUp.duration(duration);
    exiting = SlideOutDown.duration(duration);
  } else if (slide === "down") {
    entering = SlideInDown.duration(duration);
    exiting = SlideOutUp.duration(duration);
  } else {
    // None slide
    entering = fade ? FadeIn.duration(duration) : undefined;
    exiting = fade ? FadeOut.duration(duration) : undefined;
  }

  // Combine with zoom
  if (zoom) {
    entering = ZoomIn.duration(duration);
    exiting = ZoomOut.duration(duration);
  }

  return (
    <Animated.View entering={entering} exiting={exiting}>
      {children}
    </Animated.View>
  );
};

export default FadeSlideInOut;
