import { useEffect, useRef } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { markStartupCheckpoint } from "@/utils/startupDiagnostics";

type Props = {
  fontsLoaded: boolean;
};

export default function SplashScreenGate({ fontsLoaded }: Props) {
  const loadAuthDataState = useSelector(
    (state: RootState) => state?.auth?.loadAuthData,
  );
  const hasHidden = useRef(false);

  useEffect(() => {
    if (!fontsLoaded || hasHidden.current) {
      return;
    }

    const authSettled =
      loadAuthDataState?.isSuccess || loadAuthDataState?.isError;

    if (!authSettled) {
      return;
    }

    const timer = setTimeout(() => {
      hasHidden.current = true;
      SplashScreen.hideAsync()
        .then(() => markStartupCheckpoint("splash_hidden"))
        .catch(() => {});
    }, 150);

    return () => clearTimeout(timer);
  }, [
    fontsLoaded,
    loadAuthDataState?.isSuccess,
    loadAuthDataState?.isError,
  ]);

  return null;
}
