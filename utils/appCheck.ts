import { Platform } from "react-native";
import { devError, devLog, devWarn } from "@/utils/devLog";
import type { AppCheck } from "@react-native-firebase/app-check";

let initPromise: Promise<AppCheck | null> | null = null;
let appCheckInstance: AppCheck | null = null;
let getTokenFn:
  | ((instance: AppCheck, forceRefresh?: boolean) => Promise<{ token: string }>)
  | null = null;

const APP_CHECK_HEADER = "X-Firebase-AppCheck";

function isNativeMobile() {
  return Platform.OS === "ios" || Platform.OS === "android";
}

/**
 * Activate Firebase App Check once (App Attest on iOS, Play Integrity on Android).
 * Safe to call multiple times — subsequent calls reuse the same init promise.
 */
export async function initAppCheck(): Promise<AppCheck | null> {
  if (!isNativeMobile()) return null;
  if (appCheckInstance) return appCheckInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { getApp } = await import("@react-native-firebase/app");
      const appCheckModule = await import("@react-native-firebase/app-check");
      const {
        initializeAppCheck,
        ReactNativeFirebaseAppCheckProvider,
        getToken,
      } = appCheckModule;

      getTokenFn = getToken;

      const provider = new ReactNativeFirebaseAppCheckProvider();
      const debugToken =
        process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN?.trim() || "";
      if (__DEV__) {
        if (debugToken) {
          devLog("[app-check] debugToken", {
            present: true,
            length: debugToken.length,
            preview: `${debugToken.slice(0, 8)}...${debugToken.slice(-4)}`,
          });
        } else {
          devWarn(
            "[app-check] EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN is empty. " +
              "Add a UUID from Firebase Console → App Check → Manage debug tokens, then restart Metro with -c.",
          );
        }
      }

      provider.configure({
        apple: {
          // Prefer plain appAttest in production (composite fallback has caused invalid tokens).
          provider: __DEV__ ? "debug" : "appAttest",
          ...(debugToken ? { debugToken } : {}),
        },
        android: {
          provider: __DEV__ ? "debug" : "playIntegrity",
          ...(debugToken ? { debugToken } : {}),
        },
      });

      const instance = await initializeAppCheck(getApp(), {
        provider,
        isTokenAutoRefreshEnabled: true,
      });

      appCheckInstance = instance;
      devLog("[app-check] initialized");
      return instance;
    } catch (error) {
      // Soft-fail: App Check must never block app startup while backend is monitor-only.
      devWarn("[app-check] init failed", error);
      return null;
    }
  })();

  return initPromise;
}

/** Returns a cached/fresh App Check JWT, or null if unavailable. */
export async function getAppCheckToken(
  forceRefresh = false,
): Promise<string | null> {
  if (!isNativeMobile()) return null;

  try {
    const instance = await initAppCheck();
    if (!instance || !getTokenFn) return null;

    const result = await getTokenFn(instance, forceRefresh);
    const token = result?.token?.trim();
    return token || null;
  } catch (error) {
    devError("[app-check] getToken failed", error);
    return null;
  }
}

/** Attach App Check header when a token is available. */
export async function applyAppCheckHeader(headers: Headers): Promise<Headers> {
  const token = await getAppCheckToken();
  if (token) {
    headers.set(APP_CHECK_HEADER, token);
  }
  return headers;
}

export { APP_CHECK_HEADER };
