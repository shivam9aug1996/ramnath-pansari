import { Slot } from "expo-router";
export { ErrorBoundary } from "@/components/RouteErrorBoundary";
import * as SplashScreen from "expo-splash-screen";
import { Fragment, lazy, Suspense, useEffect } from "react";
import { ScrollView, View } from "react-native";
import "react-native-reanimated";
import "react-native-get-random-values";
import { Provider } from "react-redux";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { StatusBar } from "expo-status-bar";
import store from "@/redux/store";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from '@vercel/speed-insights/react';

import AppHead from "@/components/AppHead";
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
import { initAppCheck } from "@/utils/appCheck";
import "@/utils/registerDriverLocationTask";
import { initSentryAfterFirstPaint, wrapRoot } from "@/utils/sentry";
import { InitialLayout1 } from "./InitialLayout1";
import PromoConfigCacheRetainer from "@/components/PromoConfigCacheRetainer";
import { IsolateErrorBoundary } from "@/components/IsolateErrorBoundary";
import { Platform } from "react-native";
const PromoDocked = lazy(() => import("@/components/PromoDocked"));
const SPLASH_BACKGROUND = "#FFFFFF";

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 300,
  fade: true,
});

// Setup background notifications
setupNotifications();
// Start App Check ASAP (non-blocking soft-fail if unavailable).
void initAppCheck();

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
    initStartupDiagnostics().catch(() => {});
  }, []);

  useEffect(() => initSentryAfterFirstPaint(), []);

  useEffect(() => {
    if (fontsLoaded) {
      markStartupCheckpoint("fonts_loaded").catch(() => {});
    }
  }, [fontsLoaded]);



  return (
    <Fragment>
      {Platform.OS === "web" && <Analytics />}
      {Platform.OS === "web" && <SpeedInsights />}
      <AppHead
        title="Ramnath Pansari – Grocery Delivery"
        description="Order groceries, pooja items, herbal products, chemicals, wedding essentials and daily needs online from Ramnath Pansari."
      />
      <View style={{ flex: 1, backgroundColor: SPLASH_BACKGROUND }}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          {(Platform.OS === "web" || fontsLoaded) ? (
            <Provider store={store}>
              <SplashScreenGate fontsLoaded={fontsLoaded} />
              <IsolateErrorBoundary name="Push1">
                <Push1 />
              </IsolateErrorBoundary>
              <StatusBar style="dark" />
              <IsolateErrorBoundary name="AppStateExample">
                <AppStateExample />
              </IsolateErrorBoundary>
              <IsolateErrorBoundary name="PromoConfigSync">
                <PromoConfigSync />
              </IsolateErrorBoundary>
              <IsolateErrorBoundary name="PromoConfigCacheRetainer">
                <PromoConfigCacheRetainer />
              </IsolateErrorBoundary>
              <Suspense>
                <IsolateErrorBoundary name="PromoDocked">
                  <PromoDocked />
                </IsolateErrorBoundary>
              </Suspense>
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

export default wrapRoot(RootLayout);