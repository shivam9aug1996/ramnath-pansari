let cacheHydrating = false;

export function isCategoryCacheHydrating(): boolean {
  return cacheHydrating;
}

export function runCategoryCacheHydration<T>(fn: () => T): T {
  cacheHydrating = true;
  try {
    return fn();
  } finally {
    cacheHydrating = false;
  }
}
