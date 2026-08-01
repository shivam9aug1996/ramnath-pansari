/**
 * Paths that survive web page refresh instead of auth bootstrap redirect.
 *
 * After onboarding finishes there is always a token:
 * - guest    → guest token (browsing as guest)
 * - nonGuest → logged-in customer token
 *
 * Before onboarding finishes:
 * - onboardingNotDone
 *
 * Use URL pathnames (no route groups), e.g. "/about" not "/(about)/about".
 */
export const REFRESH_PERSIST_PATHS = {
  onboardingNotDone: ["/terms", "/privacy"],
  guest: ["/terms", "/privacy", "/about", "/support"],
  nonGuest: ["/terms", "/privacy", "/about", "/support"],
} as const;

export type RefreshPersistAudience = keyof typeof REFRESH_PERSIST_PATHS;

function pathMatches(pathname: string, allowed: readonly string[]) {
  return allowed.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/** True if path is in any persist list (e.g. role-guard bypass). */
export function isAnyRefreshPersistPath(pathname: string) {
  return (
    pathMatches(pathname, REFRESH_PERSIST_PATHS.onboardingNotDone) ||
    pathMatches(pathname, REFRESH_PERSIST_PATHS.guest) ||
    pathMatches(pathname, REFRESH_PERSIST_PATHS.nonGuest)
  );
}

export function shouldPersistOnRefresh(
  pathname: string,
  audience: RefreshPersistAudience,
) {
  return pathMatches(pathname, REFRESH_PERSIST_PATHS[audience]);
}
