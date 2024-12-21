import { router, Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { lazy, Suspense, useEffect, useState } from "react";
import "react-native-reanimated";
import "react-native-get-random-values";

import {
  useFonts,
  Raleway_400Regular,
  Raleway_500Medium,
  Raleway_600SemiBold,
  Raleway_700Bold,
  Raleway_800ExtraBold,
} from "@expo-google-fonts/raleway";
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from "@expo-google-fonts/montserrat";
import { Provider, useDispatch, useSelector } from "react-redux";
import store from "@/redux/store";
import { loadAuthData } from "@/redux/features/authSlice";
import { RootState } from "@/types/global";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "@/components/Toast";
import { setStatusBarBackgroundColor, StatusBar } from "expo-status-bar";
// import NetworkStatusComponent from "@/components/NetworkStatusComponent";
import Push1 from "@/components/Push1";

// const Toast = lazy(() => import("../components/Toast"));
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppStateExample from "@/components/AppStateExample";
import { useNotificationObserver } from "@/hooks/useNotificationObserver";
// import OrderSuccess from "@/components/OrderSuccess";
// import LottieMenWalking from "./(private)/(address)/LottieMenWalking";
const OrderSuccess = lazy(() => import("@/components/OrderSuccess"));
const LottieMenWalking = lazy(
  () => import("./(private)/(address)/LottieMenWalking")
);

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND_NOTIFICATION_TASK";

// Define background task
TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  async ({ data, error }) => {
    if (error) {
      console.error("Error in background task", error);
      return;
    }
    // let data = data?.data?.body ? JSON.parse(data?.data?.body) : null;
    // if (data) {
    //   console.log("ready to add in local storage", data);
    // }
    let notData = null;
    console.log("before background parse", data);
    if (!data?.data?.title) {
      if (data?.data?.body) {
        notData = JSON.parse(data?.data?.body);

        console.log("Background Notification Data:", notData);
        const existingData = JSON.parse(
          (await AsyncStorage.getItem("notificationData")) || "[]"
        );
        const updatedData = [...existingData, notData];
        await AsyncStorage.setItem(
          "notificationData",
          JSON.stringify(updatedData)
        );
      }
    }

    // Perform actions based on the notification data
  }
);

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

SplashScreen.preventAutoHideAsync();

const useMockFonts = (data) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Simulate a font loading error
      setError("Font loading error");
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return [loaded, error];
};

export function InitialLayout() {
  useNotificationObserver();

  const loadAuthDataState = useSelector(
    (state: RootState) => state?.auth?.loadAuthData
  );

  const clearAuthData = useSelector(
    (state: RootState) => state?.auth?.clearAuthData
  );
  const token = useSelector((state: RootState) => state?.auth?.token);

  const dispatch = useDispatch();
  const [isLoggedIn, setIsLoggedIn] = useState(0);
  // const router = useRouter();

  let [loaded, error] = useFonts({
    Raleway_400Regular,
    Raleway_500Medium,
    Raleway_600SemiBold,
    Raleway_700Bold,
    Raleway_800ExtraBold,

    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
  });

  useEffect(() => {
    dispatch(loadAuthData() as any);
  }, []);

  useEffect(() => {
    if (loadAuthDataState?.isSuccess == true) {
      SplashScreen.hideAsync();
      if (
        loadAuthDataState?.data?.token &&
        loadAuthDataState?.data?.userData?.name
      ) {
        setIsLoggedIn(3);
      } else if (loadAuthDataState?.data?.token) {
        setIsLoggedIn(2);
      } else {
        setIsLoggedIn(1);
      }
    } else {
      if (loadAuthDataState?.isError == true) {
        SplashScreen.hideAsync();
        setIsLoggedIn(1);
      }
    }
  }, [loadAuthDataState?.isSuccess, loadAuthDataState?.isError]);
  console.log("redfghjkl", error);
  useEffect(() => {
    if (loaded || error) {
      if (isLoggedIn == 1) {
        router.replace("/(onboarding)/onboarding");
      } else if (isLoggedIn == 2) {
        router.replace("/(auth)/name");
      } else if (isLoggedIn == 3) {
        router.replace("/(private)/(tabs)/home");
      }
    }
  }, [loaded, isLoggedIn, error]);

  useEffect(() => {
    let timeoutId; // Declare a variable to store the timeout ID

    if (clearAuthData?.isSuccess || clearAuthData?.isError) {
      if (!token) {
        timeoutId = setTimeout(() => {
          router.navigate("/(onboarding)/onboarding");
        }, 500);
      }
    }

    // Cleanup function to clear the timeout
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [clearAuthData, token]);

  return <Slot />;
}

const RootLayout = () => {
  // useEffect(() => {
  //   setStatusBarBackgroundColor("red", true);
  // }, []);
  console.log("hgffvgbhj");
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <Push1 />
        {/* <QueryClientProvider client={queryClient}> */}
        <StatusBar style="inverted" />
        {/* <Suspense> */}
        <Toast />
        <AppStateExample />
        {/* <NetworkStatusComponent /> */}
        {/* </Suspense> */}
        <Suspense fallback={null}>
          <LottieMenWalking />
        </Suspense>
        <Suspense fallback={null}>
          <OrderSuccess />
        </Suspense>
        <InitialLayout />
        {/* </QueryClientProvider> */}
      </Provider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;
