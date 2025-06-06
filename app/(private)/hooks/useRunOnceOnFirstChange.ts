import { useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Runs a callback only once, on the first change of `value` after mount.
 * It skips the initial mount.
 *
 * @param value - The state or prop to watch for changes.
 * @param callback - The callback to run once on the first update.
 */
function useRunOnceOnFirstChange(value, callback) {
  const isInitialMount = useRef(true);

  useLayoutEffect(() => {
    if (isInitialMount.current&&value) {
      // Skip on initial mount
      callback();
      isInitialMount.current = false;
    } 
  }, [value, callback]);
}

export default useRunOnceOnFirstChange;
