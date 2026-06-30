import React, { memo, useCallback, useEffect, useState } from "react";
import { LayoutChangeEvent, StyleSheet } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "expo-router";

import { Colors } from "@/constants/Colors";
import { CATEGORY_CHROME_ESTIMATED_HEIGHT } from "./productListLayout";
import { setProductListScrollParams } from "@/redux/features/productSlice";
import { RootState } from "@/types/global";

type CategoryListWrapperProps = {
  children: React.ReactNode;
};

const HIDE_DURATION = 280;
const SHOW_DURATION = 220;
const HIDE_EASING = Easing.bezier(0.4, 0, 0.2, 1);
const SHOW_EASING = Easing.bezier(0, 0, 0.2, 1);

const CategoryListWrapper = ({ children }: CategoryListWrapperProps) => {
  const dispatch = useDispatch();
  const shouldHideChrome = useSelector(
    (state: RootState) =>
      state.product?.productListScrollParams?.shouldHideChrome ?? false,
  );

  const [measuredHeight, setMeasuredHeight] = useState(0);
  const chromeHeight = useSharedValue(CATEGORY_CHROME_ESTIMATED_HEIGHT);
  const visibility = useSharedValue(1);

  useEffect(() => {
    if (measuredHeight > 0) {
      chromeHeight.value = measuredHeight;
    }
  }, [chromeHeight, measuredHeight]);

  const resetChrome = useCallback(() => {
    dispatch(setProductListScrollParams({ shouldHideChrome: false }));
    visibility.value = 1;
  }, [dispatch, visibility]);

  useFocusEffect(
    useCallback(() => {
      resetChrome();
    }, [resetChrome]),
  );

  useEffect(() => {
    cancelAnimation(visibility);

    if (shouldHideChrome) {
      visibility.value = withTiming(0, {
        duration: HIDE_DURATION,
        easing: HIDE_EASING,
      });
      return;
    }

    visibility.value = withTiming(1, {
      duration: SHOW_DURATION,
      easing: SHOW_EASING,
    });
  }, [shouldHideChrome, visibility]);

  const animatedStyle = useAnimatedStyle(() => {
    const hiddenOffset = chromeHeight.value + 16;
    return {
      opacity: visibility.value,
      transform: [
        { translateY: -(1 - visibility.value) * hiddenOffset },
        { scale: 0.96 + visibility.value * 0.04 },
      ],
    };
  });

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height > 0) {
      setMeasuredHeight(height);
    }
  }, []);

  return (
    <Animated.View
      pointerEvents={shouldHideChrome ? "none" : "box-none"}
      style={[styles.wrapper, animatedStyle]}
      onLayout={handleLayout}
    >
      {children}
    </Animated.View>
  );
};

export default memo(CategoryListWrapper);

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 45,
    left: -30,
    right: -30,
    backgroundColor: Colors.light.background,
    zIndex: 999,
  },
});
