/**
 * Neutral API base — shared by Redux and Shop Assist (no cross-imports).
 *
 * EXPO_PUBLIC_* must use static `process.env.EXPO_PUBLIC_FOO` access.
 * babel-preset-expo inlines those at build time; dynamic `process.env[key]`
 * is NOT replaced.
 */

export const DEFAULT_API_BASE =
  "https://ramnath-pansari-nextjs.vercel.app/api";

export function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE?.replace(/\/$/, "");
  if (fromEnv) return fromEnv.endsWith("/api") ? fromEnv : `${fromEnv}/api`;
  return DEFAULT_API_BASE;
}

export function resolveApiHostUrl(): string {
  return resolveApiBaseUrl().replace(/\/api$/, "");
}
