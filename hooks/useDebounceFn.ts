import { useState, useEffect } from "react";

const useDebounceFn = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  const [debouncedFunc, setDebouncedFunc] = useState(func);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFunc(func);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [func, delay]);

  return debouncedFunc;
};

export default useDebounceFn;
