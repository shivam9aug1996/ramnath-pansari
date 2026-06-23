import React, { memo, useCallback, useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "expo-router";

import GoToCart from "./GoToCart";
import { GO_TO_CART_ESTIMATED_HEIGHT } from "./productListLayout";
import {
  useGoToCartChromeActions,
  useGoToCartMeasuredInset,
} from "@/contexts/DeliveryFloatContext";
import { setProductListScrollParams } from "@/redux/features/productSlice";
import { RootState } from "@/types/global";

type GoToCartWrapperProps = {
  showGoToCart?: boolean;
  isCart?: boolean;
};

const HIDE_DURATION = 280;
const SHOW_DURATION = 220;
const HIDE_EASING = Easing.bezier(0.4, 0, 0.2, 1);
const SHOW_EASING = Easing.bezier(0, 0, 0.2, 1);

const GoToCartWrapper = ({
  showGoToCart = true,
  isCart = false,
}: GoToCartWrapperProps) => {
  const dispatch = useDispatch();
  const measuredInset = useGoToCartMeasuredInset();
  const shouldHideChrome = useSelector(
    (state: RootState) =>
      state.product?.productListScrollParams?.shouldHideChrome ?? false,
  );
  const { setGoToCartChromeHidden } = useGoToCartChromeActions();

  const barHeight = useSharedValue(GO_TO_CART_ESTIMATED_HEIGHT);
  const visibility = useSharedValue(1);

  useEffect(() => {
    if (measuredInset > 0) {
      barHeight.value = measuredInset;
    }
  }, [barHeight, measuredInset]);

  const resetChrome = useCallback(() => {
    dispatch(setProductListScrollParams({ shouldHideChrome: false }));
    setGoToCartChromeHidden?.(false);
    visibility.value = 1;
  }, [dispatch, setGoToCartChromeHidden, visibility]);

  useFocusEffect(
    useCallback(() => {
      resetChrome();
    }, [resetChrome]),
  );

  useEffect(() => {
    cancelAnimation(visibility);

    if (shouldHideChrome) {
      setGoToCartChromeHidden?.(true);
      visibility.value = withTiming(0, {
        duration: HIDE_DURATION,
        easing: HIDE_EASING,
      });
      return;
    }

    setGoToCartChromeHidden?.(false);
    visibility.value = withTiming(1, {
      duration: SHOW_DURATION,
      easing: SHOW_EASING,
    });
  }, [setGoToCartChromeHidden, shouldHideChrome, visibility]);

  const animatedStyle = useAnimatedStyle(() => {
    const hiddenOffset = barHeight.value + 32;
    return {
      opacity: visibility.value,
      transform: [
        { translateY: (1 - visibility.value) * hiddenOffset },
        { scale: 0.94 + visibility.value * 0.06 },
      ],
    };
  });

  if (!showGoToCart || isCart) return null;

  return (
    <Animated.View
      pointerEvents={shouldHideChrome ? "none" : "box-none"}
      style={[styles.wrapper, animatedStyle]}
    >
      <GoToCart isCart={isCart} embedded />
    </Animated.View>
  );
};

export default memo(GoToCartWrapper);

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
});
