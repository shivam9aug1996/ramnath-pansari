import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { router, usePathname } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import {
  GUEST_AUTH,
  loadAuthData,
  setOnboardingSeen,
} from "@/redux/features/authSlice";
import { RootState } from "@/types/global";
import { getAppHomeRoute } from "@/utils/authRoles";
import { getHasSeenOnboarding, setHasSeenOnboarding } from "@/utils/onboardingStorage";
import {
  RefreshPersistAudience,
  shouldPersistOnRefresh,
} from "@/utils/refreshPersistPaths";

const CUSTOMER_HOME = "/(private)/(tabs)/home" as const;

function isGuestSession(
  token: string | null | undefined,
  userData: { isGuestUser?: boolean } | null | undefined,
) {
  return Boolean(userData?.isGuestUser) || token === GUEST_AUTH.token;
}

/** Prefer the browser URL on web — usePathname can still be "/" during auth bootstrap. */
function getBootstrapPathname(hookPathname: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const browserPath = window.location.pathname;
    if (browserPath) return browserPath;
  }
  return hookPathname || "/";
}

export const AuthenticationFlow = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const dispatch = useDispatch();
  const pathname = usePathname();

  // Capture the refresh URL once, before role-guard / other redirects can change it.
  const initialPathRef = useRef<string | null>(null);
  if (initialPathRef.current === null) {
    initialPathRef.current = getBootstrapPathname(pathname);
  }

  const [isLoggedIn, setIsLoggedIn] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const loadAuthDataState = useSelector(
    (state: RootState) => state?.auth?.loadAuthData,
  );
  const clearAuthDataState = useSelector(
    (state: RootState) => state?.auth?.clearAuthData,
  );
  const token = useSelector((state: RootState) => state?.auth?.token);
  const userData = useSelector((state: RootState) => state?.auth?.userData);

  const logoutSessionPending = useSelector((state: RootState) =>
    Boolean(state.auth?.logoutSessionPending),
  );
  const hasSeenOnboarding = useSelector((state: RootState) =>
    Boolean(state.auth?.hasSeenOnboarding),
  );

  const isLoggingOut = logoutSessionPending;
  const authReady =
    Boolean(loadAuthDataState?.isSuccess) ||
    Boolean(loadAuthDataState?.isError);

  const stayOnPersistPath = (
    decisionPath: string,
    audience: RefreshPersistAudience,
  ) => {
    if (!shouldPersistOnRefresh(decisionPath, audience)) return false;
    const livePath = getBootstrapPathname(pathname);
    // Role guard may have already bounced to /login — restore the refresh URL.
    if (livePath !== decisionPath) {
      router.replace(decisionPath as Parameters<typeof router.replace>[0]);
    }
    return true;
  };

  useEffect(() => {
    dispatch(loadAuthData() as any);
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const decisionPath =
      initialPathRef.current || getBootstrapPathname(pathname);

    const routeAfterAuthLoad = async () => {
      if (loadAuthDataState?.isSuccess) {
        const authToken = loadAuthDataState?.data?.token;
        const authUser = loadAuthDataState?.data?.userData;
        const hasSeenOnboarding =
          loadAuthDataState?.data?.hasSeenOnboarding ??
          (await getHasSeenOnboarding());
        const guest = isGuestSession(authToken, authUser);

        if (authToken && authUser?.name && !guest) {
          // Backfill for users who finished onboarding before this flag existed
          if (!hasSeenOnboarding) {
            await setHasSeenOnboarding(true);
            dispatch(setOnboardingSeen(true));
          }
          // Onboarding done + logged-in token → nonGuest
          if (stayOnPersistPath(decisionPath, "nonGuest")) return;
          router.replace(
            getAppHomeRoute(
              authUser,
              authToken,
            ) as Parameters<typeof router.replace>[0],
          );
          return;
        }

        if (authToken && authUser?.userAlreadyRegistered === false) {
          // Mid-signup (has token, not fully registered yet)
          if (
            stayOnPersistPath(
              decisionPath,
              hasSeenOnboarding ? "nonGuest" : "onboardingNotDone",
            )
          ) {
            return;
          }
          setIsLoggedIn(2);
          return;
        }

        // Onboarding done ⇒ guest token; otherwise still in intro
        if (hasSeenOnboarding) {
          if (stayOnPersistPath(decisionPath, "guest")) return;
          router.replace(CUSTOMER_HOME);
        } else {
          if (stayOnPersistPath(decisionPath, "onboardingNotDone")) return;
          setIsLoggedIn(1);
        }
        return;
      }

      if (loadAuthDataState?.isError) {
        const hasSeenOnboarding = await getHasSeenOnboarding();
        if (hasSeenOnboarding) {
          // Onboarding done normally implies a token; treat as guest fallback
          if (stayOnPersistPath(decisionPath, "guest")) return;
          router.replace(CUSTOMER_HOME);
        } else {
          if (stayOnPersistPath(decisionPath, "onboardingNotDone")) return;
          setIsLoggedIn(1);
        }
      }
    };

    void routeAfterAuthLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAuthDataState, isReady]);

  useEffect(() => {
    if (!isReady) return;
    if (isLoggedIn === 1) {
      router.replace("/(onboarding)/onboarding");
    } else if (isLoggedIn === 2) {
      router.replace("/(auth)/name");
    } else if (isLoggedIn === 3) {
      router.replace(CUSTOMER_HOME);
    }
  }, [isLoggedIn, isReady]);

  /**
   * Ongoing gate (not only refresh): if intro is unfinished, block escapes to
   * home / other app routes. Persist paths like /terms stay allowed.
   */
  useEffect(() => {
    if (!isReady || !authReady || isLoggingOut || hasSeenOnboarding) return;

    const livePath = getBootstrapPathname(pathname);
    if (shouldPersistOnRefresh(livePath, "onboardingNotDone")) return;

    const allowedWhileOnboarding =
      livePath === "/onboarding" ||
      livePath.startsWith("/onboarding/") ||
      livePath === "/login" ||
      livePath === "/verify" ||
      livePath === "/name";
    if (allowedWhileOnboarding) return;

    router.replace("/(onboarding)/onboarding");
  }, [
    pathname,
    isReady,
    authReady,
    hasSeenOnboarding,
    isLoggingOut,
  ]);

  // After logout, guest auth is already set — skip onboarding if already seen.
  useEffect(() => {
    if (!isReady || isLoggingOut) return;

    const routeAfterLogout = async () => {
      if (
        clearAuthDataState?.isSuccess &&
        token === GUEST_AUTH.token &&
        userData?.isGuestUser
      ) {
        const hasSeenOnboarding =
          clearAuthDataState?.data?.hasSeenOnboarding ??
          (await getHasSeenOnboarding());
        router.replace(
          hasSeenOnboarding ? CUSTOMER_HOME : "/(onboarding)/onboarding",
        );
      } else if (clearAuthDataState?.isError && !token) {
        const hasSeenOnboarding = await getHasSeenOnboarding();
        router.replace(
          hasSeenOnboarding ? CUSTOMER_HOME : "/(onboarding)/onboarding",
        );
      }
    };

    void routeAfterLogout();
  }, [
    clearAuthDataState?.isSuccess,
    clearAuthDataState?.isError,
    clearAuthDataState?.data?.hasSeenOnboarding,
    token,
    userData?.isGuestUser,
    isReady,
    isLoggingOut,
  ]);

  if (isLoggingOut) {
    return (
      <View style={styles.logoutGate}>
        <ActivityIndicator size="large" color="#2f3a2f" />
      </View>
    );
  }

  return children;
};

const styles = StyleSheet.create({
  logoutGate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
});
