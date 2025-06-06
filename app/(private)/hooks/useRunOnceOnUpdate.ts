import { useEffect, useRef } from 'react';

/**
 * Runs callback only once, on the first update of `value` (skipping initial mount).
 * @param value - The state or prop to watch.
 * @param callback - The function to run once on first update.
 */
function useRunOnceOnUpdate(value, callback) {
  const isInitialMount = useRef(true);
  const hasRun = useRef(false);

  useEffect(() => {
    if (isInitialMount.current) {
      // Skip effect on initial mount
      isInitialMount.current = false;
    } else if (!hasRun.current) {
      // Run callback on first update only
      callback();
      hasRun.current = true;
    }
  }, [value, callback]);
}

export default useRunOnceOnUpdate;
