import { useCallback, useRef } from "react";
import { NativeSyntheticEvent, NativeScrollEvent } from "react-native";

export const useScrollDirection = (
  onScrollChange: (params: { isBeyondThreshold: boolean; direction: "up" | "down" }) => void,
  threshold: number = 200, // 200px from top
  directionDelta: number = 10 // Trigger only after 10px movement
) => {
  const isBeyond = useRef(false);
  const lastY = useRef(0);
  const lastDirection = useRef<"up" | "down" | null>(null);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = e.nativeEvent.contentOffset.y;
      const contentHeight = e.nativeEvent.contentSize.height; // Get total content height
      const layoutHeight = e.nativeEvent.layoutMeasurement.height; // Get the visible height of the ScrollView
      const isAtBottom = currentY + layoutHeight >= contentHeight - 200;

      // Skip if small movement (less than directionDelta px)
      if (Math.abs(currentY - lastY.current) < directionDelta) return;

      // Detect direction
      const direction: "up" | "down" = currentY > lastY.current ? "down" : "up";

      let shouldFire = false;
     
      // Fire only if direction changes
      if (direction !== lastDirection.current) {
        lastDirection.current = direction;
        shouldFire = true;
      }

      // Detect threshold
      if (currentY > threshold && !isBeyond.current) {
        isBeyond.current = true;
        shouldFire = true;
      } else if (currentY <= threshold && isBeyond.current) {
        isBeyond.current = false;
        shouldFire = true;
      }
      

      if(isAtBottom){
        lastDirection.current = !direction;
      }
     
      if (shouldFire && !isAtBottom) {
        onScrollChange({
          isBeyondThreshold: isBeyond.current,
          direction,
        });
      }

      lastY.current = currentY;
    },
    [onScrollChange, threshold, directionDelta]
  );

  return handleScroll;
};