import { useRef } from "react";

const usePreventDoubleTap = (delay: number = 500) => {
  const lastTapRef = useRef<number | null>(null);

  const preventDoubleTap = (callback: () => void) => {
    const now = Date.now();

    if (lastTapRef.current && now - lastTapRef.current < delay) {
      return;
    }

    lastTapRef.current = now;
    callback();
  };

  return preventDoubleTap;
};

export default usePreventDoubleTap;
