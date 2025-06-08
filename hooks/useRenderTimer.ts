import { useEffect, useRef } from 'react';

export const useRenderTimer = (label: string) => {
  const renderCount = useRef(0);

  // Start timing in useRef-safe place
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const duration = performance.now() - startTime.current;
   // console.log(`${label} render count: ${renderCount.current}, took ${duration.toFixed(2)}ms`);
  });
};