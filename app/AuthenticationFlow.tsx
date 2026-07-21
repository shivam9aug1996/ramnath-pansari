import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { GUEST_AUTH, loadAuthData } from "@/redux/features/authSlice";
import { RootState } from "@/types/global";
import { getAppHomeRoute } from "@/utils/authRoles";
import { Text } from "react-native";

export const AuthenticationFlow = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();
 
  const [isLoggedIn, setIsLoggedIn] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const loadAuthDataState = useSelector((state: RootState) => state?.auth?.loadAuthData);
  const clearAuthDataState = useSelector((state: RootState) => state?.auth?.clearAuthData);
  const token = useSelector((state: RootState) => state?.auth?.token);
  const userData = useSelector((state: RootState) => state?.auth?.userData);

  const logoutSessionPending = useSelector(
    (state: RootState) => Boolean(state.auth?.logoutSessionPending),
  );

  const isLoggingOut = logoutSessionPending;


  useEffect(() => {
    dispatch(loadAuthData() as any);
   // Set ready after a brief delay to ensure Slot is rendered
   const timer = setTimeout(() => {
    setIsReady(true);
  }, 100);
  return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (loadAuthDataState?.isSuccess) {
      if (loadAuthDataState?.data?.token && loadAuthDataState?.data?.userData?.name) {
        router.replace(
          getAppHomeRoute(
            loadAuthDataState.data.userData,
            loadAuthDataState.data.token,
          ) as Parameters<typeof router.replace>[0],
        );
      } else if (loadAuthDataState?.data?.token && loadAuthDataState?.data?.userData?.userAlreadyRegistered === false) {
        setIsLoggedIn(2);
      } else {
        setIsLoggedIn(1);
      }
    } else if (loadAuthDataState?.isError) {
      setIsLoggedIn(1);
    }
  }, [loadAuthDataState, isReady]);

  useEffect(() => {
    if (!isReady) return;
    if (isLoggedIn === 1) {
      router.replace("/(onboarding)/onboarding");
    } else if (isLoggedIn === 2) {
      router.replace("/(auth)/name");
    } else if (isLoggedIn === 3) {
      router.replace("/(private)/(tabs)/home");
    }
  }, [isLoggedIn, isReady]);

  // After logout, guest auth is already set — only then navigate to onboarding.
  useEffect(() => {
    if (!isReady || isLoggingOut) return;
    if (
      clearAuthDataState?.isSuccess &&
      token === GUEST_AUTH.token &&
      userData?.isGuestUser
    ) {
      router.replace("/(onboarding)/onboarding");
    } else if (clearAuthDataState?.isError && !token) {
      router.replace("/(onboarding)/onboarding");
    }
  }, [
    clearAuthDataState?.isSuccess,
    clearAuthDataState?.isError,
    token,
    userData?.isGuestUser,
    isReady,
    isLoggingOut,
  ]);

  // Hide app UI until guest session is installed — prevents in-flight home
  // requests from racing a null-token gap.
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
