import { useState, useCallback, useEffect } from "react";

let VeryExpensive = null;

function useLazyComponent(module = null) {
  const [needsExpensive, setNeedsExpensive] = useState(false);

  useEffect(() => {
    if (VeryExpensive == null) {
      VeryExpensive = module;
    }

    setNeedsExpensive(true);
  }, []);

  return [needsExpensive, VeryExpensive];
}

export default useLazyComponent;
