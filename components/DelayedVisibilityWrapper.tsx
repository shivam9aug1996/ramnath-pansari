import React, { useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

const DelayedVisibilityWrapper = ({ delay = 500, children, fallback }: any) => {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<any>(null);
  useFocusEffect(
    React.useCallback(() => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);

      return () => {
        clearTimeout(timerRef.current);
        setIsVisible(false);
      };
    }, [delay])
  );

  // Render children only if the delay has passed
  return isVisible ? <>{children}</> : <>{fallback}</>;
};

export default DelayedVisibilityWrapper;
