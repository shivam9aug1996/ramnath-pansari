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
