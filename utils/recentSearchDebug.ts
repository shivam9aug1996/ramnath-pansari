let cacheHydrating = false;

/** True while upsertQueryData runs for local/cache hydration (no HTTP). */
export function isRecentSearchCacheHydrating(): boolean {
  return cacheHydrating;
}

/** Wrap RTK upsertQueryData so startup logs can skip fake fetch lifecycle events. */
export async function runRecentSearchCacheHydration<T>(
  fn: () => T | Promise<T>,
): Promise<T> {
  cacheHydrating = true;
  try {
    return await fn();
  } finally {
    cacheHydrating = false;
  }
}

export function recentSearchLog(label: string, data?: unknown): void {
  if (!__DEV__) return;
  if (data !== undefined) {
    console.log(`[recent-search] ${label}`, data);
  } else {
    console.log(`[recent-search] ${label}`);
  }
}
