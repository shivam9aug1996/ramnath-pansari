import { useEffect, useState } from "react";
import { router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { loadAuthData } from "@/redux/features/authSlice";
import { RootState } from "@/types/global";

export const AuthenticationFlow = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();
  const [isLoggedIn, setIsLoggedIn] = useState(0);

  const loadAuthDataState = useSelector((state: RootState) => state?.auth?.loadAuthData);
  const clearAuthData = useSelector((state: RootState) => state?.auth?.clearAuthData);
  const token = useSelector((state: RootState) => state?.auth?.token);

  useEffect(() => {
    dispatch(loadAuthData() as any);
  }, []);
  //console.log("loadAuthDataState", loadAuthDataState,isLoggedIn);

  useEffect(() => {
    if (loadAuthDataState?.isSuccess) {
      if (loadAuthDataState?.data?.token && loadAuthDataState?.data?.userData?.name) {
        setIsLoggedIn(3);
      } else if (loadAuthDataState?.data?.token && loadAuthDataState?.data?.userData?.userAlreadyRegistered === false) {
        setIsLoggedIn(2);
      } else {
        setIsLoggedIn(1);
      }
    } else if (loadAuthDataState?.isError) {
      setIsLoggedIn(1);
    }
  }, [loadAuthDataState]);

  useEffect(() => {
    if (isLoggedIn === 1) {
      router.replace("/(onboarding)/onboarding");
    } else if (isLoggedIn === 2) {
      router.replace("/(auth)/name");
    } else if (isLoggedIn === 3) {
      router.replace("/(private)/(tabs)/home");
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if ((clearAuthData?.isSuccess || clearAuthData?.isError) && !token) {
      const timeoutId = setTimeout(() => {
        router.navigate("/(onboarding)/onboarding");
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [clearAuthData, token]);

  return children;
}; 