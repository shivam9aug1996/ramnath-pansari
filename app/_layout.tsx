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
// import Toast from "@/components/Toast";
import Toast, { BaseToast } from "react-native-toast-message";

import { setStatusBarBackgroundColor, StatusBar } from "expo-status-bar";
// import NetworkStatusComponent from "@/components/NetworkStatusComponent";
import Push1 from "@/components/Push1";

// const Toast = lazy(() => import("../components/Toast"));
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppStateExample from "@/components/AppStateExample";
import { useNotificationObserver } from "@/hooks/useNotificationObserver";
import { fonts } from "@/constants/Fonts";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
// import OrderSuccess from "@/components/OrderSuccess";
import LottieMenWalking from "./(private)/(address)/LottieMenWalking";
const OrderSuccess = lazy(() => import("@/components/OrderSuccess"));
// const LottieMenWalking = lazy(
//   () => import("./(private)/(address)/LottieMenWalking")
// );

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
  const toastConfig = {
    success: (props) => (
      <BaseToast
        {...props}
        style={{
          backgroundColor: "#eafaf1", // Softer green shade for a modern look
          borderLeftWidth: 4, // Thicker left border for emphasis
          borderWidth: 1,
          borderColor: "#a3d9b5", // Subtle border color matching the green theme
          borderLeftColor: "#55c57a", // Vibrant green for left border
          borderRadius: 10, // Rounded corners for a softer look
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 3, // Subtle shadow for depth on Android
        }}
        contentContainerStyle={{
          paddingHorizontal: 15,
          paddingVertical: 10, // Balanced padding for better spacing
        }}
        text2Style={{
          ...fonts.defaultRegular,
          fontSize: 14, // Slightly larger text for better readability
          color: "#333", // Neutral dark gray for text
          marginRight: 50,
        }}
        renderLeadingIcon={() => (
          <Ionicons
            name="checkmark-circle"
            size={28} // Slightly smaller icon for balance
            style={{
              color: "#55c57a", // Matching the left border for consistency
              alignSelf: "center",
              marginLeft: 10,
            }}
          />
        )}
      />
    ),

    error: (props) => (
      <BaseToast
        {...props}
        style={{
          backgroundColor: "#fdecea", // Light red background for error
          borderLeftWidth: 4,
          borderWidth: 1,
          borderColor: "#f5c6cb", // Subtle red for border
          borderLeftColor: "#e63946", // Vibrant red for left border
          borderRadius: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 3,
        }}
        contentContainerStyle={{
          paddingHorizontal: 15,
          paddingVertical: 10,
        }}
        text2Style={{
          ...fonts.defaultRegular,
          fontSize: 14,
          color: "#721c24", // Dark red for text
          marginRight: 50,
        }}
        renderLeadingIcon={() => (
          <Ionicons
            name="close-circle"
            size={28}
            style={{
              color: "#e63946",
              alignSelf: "center",
              marginLeft: 10,
            }}
          />
        )}
      />
    ),

    /*
      Or create a completely new type - `tomatoToast`,
      building the layout from scratch.
  
      I can consume any custom `props` I want.
      They will be passed when calling the `show` method (see below)
    */
    info: (props) => (
      <BaseToast
        {...props}
        style={{
          backgroundColor: "#eaf4fc", // Light blue background for info
          borderLeftWidth: 4,
          borderWidth: 1,
          borderColor: "#a3cfe3", // Subtle blue for border
          borderLeftColor: "#3498db", // Vibrant blue for left border
          borderRadius: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 3,
        }}
        contentContainerStyle={{
          paddingHorizontal: 15,
          paddingVertical: 10,
        }}
        text2Style={{
          ...fonts.defaultRegular,
          fontSize: 12,
          color: "#2c3e50", // Dark gray-blue for text
          marginRight: 50,
        }}
        text2NumberOfLines={2}
        renderLeadingIcon={() => (
          <Ionicons
            name="information-circle"
            size={28}
            style={{
              color: "#3498db",
              alignSelf: "center",
              marginLeft: 10,
            }}
          />
        )}
      />
    ),
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <Push1 />
        {/* <QueryClientProvider client={queryClient}> */}
        <StatusBar style="inverted" />
        {/* <Suspense> */}

        <AppStateExample />
        {/* <NetworkStatusComponent /> */}
        {/* </Suspense> */}

        <LottieMenWalking />

        <Suspense fallback={null}>
          <OrderSuccess />
        </Suspense>
        <InitialLayout />
        {/* </QueryClientProvider> */}
        <Toast config={toastConfig} position="top" topOffset={60} />
      </Provider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;
