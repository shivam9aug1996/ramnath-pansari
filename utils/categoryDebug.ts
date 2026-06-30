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

export function categoryLog(label: string, data?: unknown): void {
  if (!__DEV__) return;
  if (data !== undefined) {
    console.log(`[category] ${label}`, data);
  } else {
    console.log(`[category] ${label}`);
  }
}
