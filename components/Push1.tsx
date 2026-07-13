import { useState, useEffect, useRef } from "react";
import { devError, devLog, devWarn } from "@/utils/devLog";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useDispatch, useSelector } from "react-redux";
import { orderApi } from "@/redux/features/orderSlice";
import { RootState } from "@/types/global";
import { router } from "expo-router";
import {
  setLastSavedPushToken,
} from "@/redux/features/authSlice";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function handleRegistrationError(errorMessage: string) {
  throw new Error(errorMessage);
}

function parseNotificationPayload(data: Record<string, unknown> | undefined) {
  if (!data) return null;
  const body = data.body;
  if (!body) return data;
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return data;
    }
  }
  return body as Record<string, unknown>;
}

function navigateFromNotification(orderId: string) {
  setTimeout(() => {
    try {
      router.push(`/(orderDetail)/${orderId}`);
    } catch (error) {
      devWarn("Notification navigation failed:", error);
    }
  }, 800);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    handleRegistrationError(
      "Permission not granted to get push token for push notification!"
    );
    return;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;
  if (!projectId) {
    handleRegistrationError("Project ID not found");
  }

  try {
    const pushTokenString = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;
    return pushTokenString;
  } catch (e: unknown) {
    handleRegistrationError(`${e}`);
  }
}

export default function Push1() {
  const userData = useSelector((state: RootState) => state?.auth?.userData);
  const lastSavedPushToken = useSelector(
    (state: RootState) => state?.auth?.lastSavedPushToken
  );
  const userId = userData?._id;
  const dispatch = useDispatch();
  const [expoPushToken, setExpoPushToken] = useState("");
  const notificationListener =
    useRef<ReturnType<typeof Notifications.addNotificationReceivedListener>>();
  const responseListener =
    useRef<
      ReturnType<typeof Notifications.addNotificationResponseReceivedListener>
    >();

  useEffect(() => {
    if (expoPushToken && userId) {
      dispatch(setLastSavedPushToken(expoPushToken) as any);
    }
  }, [expoPushToken, userId, lastSavedPushToken, dispatch]);

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => {
        setExpoPushToken(token ?? "");
      })
      .catch((error: unknown) => setExpoPushToken(`${error}`));

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        try {
          const notData = parseNotificationPayload(
            notification?.request?.content?.data as
              | Record<string, unknown>
              | undefined
          );
          if (notData?.updateOrderStatus) {
            // dispatch(
            //   orderApi.util.invalidateTags([
            //     {
            //       type: "detailOrder",
            //       id: `${notData?.orderId}-${notData?.userId}`,
            //     },
            //   ])
            // );
            // dispatch(
            //   orderApi.util.invalidateTags([
            //     { type: "orderList", id: `${notData?.userId}` },
            //   ])
            // );
          }
        } catch (error) {
          devWarn("Failed to handle received notification:", error);
        }
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        try {
          const title = response?.notification?.request?.content?.title;
          if (!title) return;

          const notData = parseNotificationPayload(
            response?.notification?.request?.content?.data as
              | Record<string, unknown>
              | undefined
          );

          if (notData?.updateOrderStatus && notData?.orderId) {
            navigateFromNotification(String(notData.orderId));
          }
        } catch (error) {
          devWarn("Failed to handle notification response:", error);
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [dispatch]);

  return null;
}
