import { Slot } from "expo-router";
import { devError, devLog, devWarn } from "@/utils/devLog";
import * as SplashScreen from "expo-splash-screen";
import { Fragment, useEffect } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import "react-native-get-random-values";
import { Provider } from "react-redux";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { StatusBar } from "expo-status-bar";

import store from "@/redux/store";


import Push1 from "@/components/Push1";
import AppStateExample from "@/components/AppStateExample";
import PromoConfigSync from "@/components/PromoConfigSync";
import { setupNotifications } from "./notificationService";
import SplashScreenGate from "@/components/SplashScreenGate";
import { AuthenticationFlow } from "./AuthenticationFlow";
import { toastConfig } from "./toastconfig";
import { useFonts } from "./useFonts";
import {
  initStartupDiagnostics,
  markStartupCheckpoint,
} from "@/utils/startupDiagnostics";
import "@/utils/driverLocationTask";

const SPLASH_BACKGROUND = "#FFFFFF";

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 300,
  fade: true,
});

// Setup background notifications
setupNotifications();

export function InitialLayout() {

  return (
    <AuthenticationFlow>
      <Slot />
    </AuthenticationFlow>
  );
}

const RootLayout = () => {
  const [fontsLoaded] = useFonts();

  useEffect(() => {
    initStartupDiagnostics().catch((error) => {
      devWarn("[startup-diag] init failed", error);
    });
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      markStartupCheckpoint("fonts_loaded").catch(() => {});
    }
  }, [fontsLoaded]);

  return (
    <Fragment>
      <View style={{ flex: 1, backgroundColor: SPLASH_BACKGROUND }}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          {fontsLoaded ? (
            <Provider store={store}>
              <SplashScreenGate fontsLoaded={fontsLoaded} />
              <Push1 />
              <StatusBar style="dark" />
              <AppStateExample />
              <PromoConfigSync />
              <InitialLayout />
            </Provider>
          ) : null}
        </GestureHandlerRootView>
      </View>

      {fontsLoaded ? (
        <Toast config={toastConfig} position="top" topOffset={60} />
      ) : null}
    </Fragment>
  );
};

export default RootLayout;