import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Fragment } from "react";
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
import { setupNotifications } from "./notificationService";
import SplashScreenGate from "@/components/SplashScreenGate";
import { AuthenticationFlow } from "./AuthenticationFlow";
import { toastConfig } from "./toastconfig";
import { useFonts } from "./useFonts";

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