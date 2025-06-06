import { useRef, useEffect } from "react";
import { Animated } from "react-native";

const getCloser = (value, checkOne, checkTwo) =>
  Math.abs(value - checkOne) < Math.abs(value - checkTwo) ? checkOne : checkTwo;

const scrollEventThrottle = 16;
const { diffClamp } = Animated;
const headerHeight = 120 * 2;

const useScroll = () => {
  const ref = useRef(null);
  const scrollY = useRef(new Animated.Value(0));
  const scrollYClamped = diffClamp(scrollY.current, 0, headerHeight);

  const translateY = scrollYClamped.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -(headerHeight / 2)],
  });

  const translateYNumber = useRef(0);

  useEffect(() => {
    const listenerId = translateY.addListener(({ value }) => {
      translateYNumber.current = value;
    });

    // Cleanup listener on component unmount
    return () => {
      translateY.removeListener(listenerId);
    };
  }, [translateY]);

  const handleScroll = Animated.event(
    [
      {
        nativeEvent: {
          contentOffset: { y: scrollY.current },
        },
      },
    ],
    {
      useNativeDriver: true,
    }
  );

  const handleSnap = ({ nativeEvent }) => {
    console.log("ui");
    const offsetY = nativeEvent.contentOffset.y;
    if (
      !(
        translateYNumber.current === 0 ||
        translateYNumber.current === -headerHeight / 2
      )
    ) {
      if (ref.current) {
        ref.current.scrollToOffset({
          offset:
            getCloser(translateYNumber.current, -headerHeight / 2, 0) ===
            -headerHeight / 2
              ? offsetY + headerHeight / 2
              : offsetY - headerHeight / 2,
        });
      }
    }
  };

  return [translateY, handleScroll, handleSnap, scrollEventThrottle];
};

export default useScroll;
