import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import {
  GUEST_AUTH,
  loadAuthData,
  setOnboardingSeen,
} from "@/redux/features/authSlice";
import { RootState } from "@/types/global";
import { getAppHomeRoute } from "@/utils/authRoles";
import { getHasSeenOnboarding, setHasSeenOnboarding } from "@/utils/onboardingStorage";

const CUSTOMER_HOME = "/(private)/(tabs)/home" as const;

function isGuestSession(
  token: string | null | undefined,
  userData: { isGuestUser?: boolean } | null | undefined,
) {
  return Boolean(userData?.isGuestUser) || token === GUEST_AUTH.token;
}

export const AuthenticationFlow = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const dispatch = useDispatch();

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

  const isLoggingOut = logoutSessionPending;

  useEffect(() => {
    dispatch(loadAuthData() as any);
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const routeAfterAuthLoad = async () => {
      if (loadAuthDataState?.isSuccess) {
        const authToken = loadAuthDataState?.data?.token;
        const authUser = loadAuthDataState?.data?.userData;
        const hasSeenOnboarding =
          loadAuthDataState?.data?.hasSeenOnboarding ??
          (await getHasSeenOnboarding());

        if (
          authToken &&
          authUser?.name &&
          !isGuestSession(authToken, authUser)
        ) {
          // Backfill for users who finished onboarding before this flag existed
          if (!hasSeenOnboarding) {
            await setHasSeenOnboarding(true);
            dispatch(setOnboardingSeen(true));
          }
          router.replace(
            getAppHomeRoute(
              authUser,
              authToken,
            ) as Parameters<typeof router.replace>[0],
          );
          return;
        }

        if (authToken && authUser?.userAlreadyRegistered === false) {
          setIsLoggedIn(2);
          return;
        }

        // Guest / logged out: skip intro if already completed once
        if (hasSeenOnboarding) {
          router.replace(CUSTOMER_HOME);
        } else {
          setIsLoggedIn(1);
        }
        return;
      }

      if (loadAuthDataState?.isError) {
        const hasSeenOnboarding = await getHasSeenOnboarding();
        if (hasSeenOnboarding) {
          router.replace(CUSTOMER_HOME);
        } else {
          setIsLoggedIn(1);
        }
      }
    };

    void routeAfterAuthLoad();
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
