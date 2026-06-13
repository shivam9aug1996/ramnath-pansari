import React, { useEffect, useState, ReactNode } from "react";

interface DeferredMountProps {
  children: ReactNode;
  delay?: number;
  fallback?: ReactNode;
  /** When true, skip delay in __DEV__ for faster local iteration */
  skipDelayInDev?: boolean;
}

const DeferredMount: React.FC<DeferredMountProps> = ({
  children,
  delay = 0,
  fallback = null,
  skipDelayInDev = false,
}) => {
  const [mounted, setMounted] = useState(
    () => skipDelayInDev && __DEV__
  );

  useEffect(() => {
    if (skipDelayInDev && __DEV__) {
      setMounted(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      setMounted(true);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [delay, skipDelayInDev]);

  if (!mounted) {
    return fallback ?? null;
  }

  return <>{children}</>;
};

export default DeferredMount;
