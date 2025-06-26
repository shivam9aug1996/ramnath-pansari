import { router, Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Fragment, Suspense, useEffect } from "react";
import { Platform, View } from "react-native";
import "react-native-reanimated";
import "react-native-get-random-values";
import { Provider, useDispatch } from "react-redux";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { StatusBar } from "expo-status-bar";

import store from "@/redux/store";


import Push1 from "@/components/Push1";
import AppStateExample from "@/components/AppStateExample";
import OrderSuccess from "@/components/OrderSuccess";
import LottieMenWalking from "./(private)/(address)/LottieMenWalking";
import { setupNotifications } from "./notificationService";
import { AuthenticationFlow } from "./AuthenticationFlow";
import { useFonts } from "./useFonts";
import { toastConfig } from "./toastconfig";
import { ItemTaskQueue } from "@/utils/ItemTaskQueueManager";
import { setIsCartOperationProcessing } from "@/redux/features/cartSlice";


// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
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
    const hideSplashScreen = async () => {
      
        await new Promise(resolve => setTimeout(resolve, 1000));
        await SplashScreen.hideAsync();
      }

    hideSplashScreen();
  }, []);

 

  return (
    <Fragment>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <Push1 />
          <StatusBar style={"dark"} />
          <AppStateExample />

          {/* <Suspense fallback={null}>
            <OrderSuccess />
          </Suspense> */}

          <InitialLayout />
        </Provider>
      </GestureHandlerRootView>
      
      <Toast config={toastConfig} position="top" topOffset={60} />
      
      {/* {Platform.OS == "ios" ? <LottieMenWalking /> : null} */}
    </Fragment>
  );
};

export default RootLayout;