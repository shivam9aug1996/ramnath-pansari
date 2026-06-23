import { useCallback, useRef } from "react";
import { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

export type HideOnScrollOptions = {
  /** Scroll offset from top where chrome always stays visible */
  topRevealOffset?: number;
  /** Minimum vertical delta (px) before toggling hide/show */
  directionThreshold?: number;
  /** Distance from max scrollY treated as "at list end" */
  scrollEndTolerance?: number;
};

/**
 * Hide bottom chrome when the user scrolls deeper into the list;
 * reveal it when scrolling back toward the top (standard grocery-app pattern).
 */
export function useHideOnScroll(
  onVisibilityChange: (hidden: boolean) => void,
  options: HideOnScrollOptions = {},
) {
  const {
    topRevealOffset = 100,
    directionThreshold = 12,
    scrollEndTolerance = 8,
  } = options;

  const isHiddenRef = useRef(false);
  const lastYRef = useRef(0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const y = contentOffset.y;
      const maxScrollY = Math.max(
        0,
        contentSize.height - layoutMeasurement.height,
      );
      const atScrollEnd = maxScrollY > 0 && y >= maxScrollY - scrollEndTolerance;
      const nearTop = y <= topRevealOffset;

      if (nearTop) {
        if (isHiddenRef.current) {
          isHiddenRef.current = false;
          onVisibilityChange(false);
        }
        lastYRef.current = y;
        return;
      }

      const deltaY = y - lastYRef.current;

      // At the list tail, ignore rubber-band / micro-movements that flip hide state.
      if (atScrollEnd) {
        if (deltaY < -directionThreshold && isHiddenRef.current) {
          isHiddenRef.current = false;
          onVisibilityChange(false);
        }
        lastYRef.current = y;
        return;
      }

      if (Math.abs(deltaY) < directionThreshold) {
        return;
      }

      const nextHidden = deltaY > 0;
      if (nextHidden !== isHiddenRef.current) {
        isHiddenRef.current = nextHidden;
        onVisibilityChange(nextHidden);
      }

      lastYRef.current = y;
    },
    [
      directionThreshold,
      onVisibilityChange,
      scrollEndTolerance,
      topRevealOffset,
    ],
  );

  const reset = useCallback(() => {
    isHiddenRef.current = false;
    lastYRef.current = 0;
    onVisibilityChange(false);
  }, [onVisibilityChange]);

  return { handleScroll, reset };
}
