import { useState, useEffect, useRef } from "react";
import { Text, View, Button, Platform, TextInput } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useNotificationObserver } from "@/hooks/useNotificationObserver";
import { useDispatch, useSelector } from "react-redux";
import { orderApi } from "@/redux/features/orderSlice";
import { RootState } from "@/types/global";
import { router } from "expo-router";
import {
  loadPushToken,
  savePushToken1,
  savePushTokenToStorage,
  setLastSavedPushToken,
  useSavePushTokenMutation,
} from "@/redux/features/authSlice";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function sendPushNotification(expoPushToken: string) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title: "Original Title",
    body: "And here is the body!",
    data: { someData: "goes here" },
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}

function handleRegistrationError(errorMessage: string) {
  // alert(errorMessage);
  throw new Error(errorMessage);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (true) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
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
    // console.log("projectId", projectId);
    if (!projectId) {
      handleRegistrationError("Project ID not found");
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      // console.log("pushTokenString", pushTokenString);
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    handleRegistrationError("Must use physical device for push notifications");
  }
}

export default function Push1() {
  const userData = useSelector((state: RootState) => state?.auth?.userData);
  const lastSavedPushToken = useSelector(
    (state: RootState) => state?.auth?.lastSavedPushToken
  );
  const userId = userData?._id;
  const isGuestUser = userData?.isGuestUser;
  const isAdminUser = userData?.isAdminUser;
  console.log("us767890-890-erId", lastSavedPushToken);
  const dispatch = useDispatch();
  const [savePushToken] = useSavePushTokenMutation();
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  console.log("expoPushToken", expoPushToken);

  // useEffect(() => {
  //   dispatch(loadPushToken() as any);
  // }, []);

  useEffect(() => {
    if (expoPushToken && userId) {
      dispatch(setLastSavedPushToken(expoPushToken) as any);
      //dispatch(savePushToken1() as any);
      console.log("lastSavedPushToken4567890", lastSavedPushToken);
      console.log("expoPushToken4567890", expoPushToken);
     //dispatch(savePushTokenToStorage(expoPushToken) as any);
      // if (lastSavedPushToken !== expoPushToken) {
       
            // if(lastSavedPushToken !== expoPushToken){
              
            //   dispatch(savePushToken1() as any);
            // }
           // console.log("body4534567890-67890", body);
        // savePushToken(body)
        //   .unwrap()
        //   .then((res) => {
        //     console.log("res456789765456789", res);
        //     //dispatch(savePushTokenToStorage(token));
        //   })
        //   .catch((err) => {
        //     console.log("err456789", err);
        //   });
      //}
    }
  }, [ expoPushToken,userId,lastSavedPushToken]);
  console.log("lastSavedPushToken4567890-", lastSavedPushToken);
  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => {
        setExpoPushToken(token ?? "");
      })
      .catch((error: any) => setExpoPushToken(`${error}`));

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        // console.log("kjhgertyjkl;", JSON.stringify(notification));
        let notData = notification?.request?.content?.data?.body;
        if (notData) {
          notData = JSON.parse(notification?.request?.content?.data?.body);
          if (notData?.updateOrderStatus) {
            // console.log("jhgfdcvbnm567890,./", notData);

            dispatch(
              orderApi.util.invalidateTags([
                {
                  type: "detailOrder",
                  id: `${notData?.orderId}-${notData?.userId}`,
                },
              ])
            );

            dispatch(
              orderApi.util.invalidateTags([
                { type: "orderList", id: `${notData?.userId}` },
              ])
            );
          }
        }

        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        let notData = response?.notification?.request?.content?.data;
        let title = response?.notification?.request?.content?.title;
        // console.log("kjhgert567890-yjkl;", JSON.stringify(response));
        if (!title) {
          return;
        }
        if (notData?.body) {
          notData = JSON.parse(notData?.body);
        }
        if (notData?.updateOrderStatus) {
          router.navigate(`/(orderDetail)/${notData?.orderId}`);
        }
      });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return null;
  // <View
  //   style={{
  //     flex: 1,
  //     alignItems: "center",
  //     justifyContent: "space-around",
  //     zIndex: 100,
  //     backgroundColor: "red",
  //   }}
  // >
  //   <TextInput style={{ padding: 10 }} multiline>
  //     Your Expo push token: {expoPushToken}
  //   </TextInput>
  //   <View style={{ alignItems: "center", justifyContent: "center" }}>
  //     <Text>
  //       Title: {notification && notification.request.content.title}{" "}
  //     </Text>
  //     <Text>Body: {notification && notification.request.content.body}</Text>
  //     <Text>
  //       Data:{" "}
  //       {notification && JSON.stringify(notification.request.content.data)}
  //     </Text>
  //   </View>
  //   <Button
  //     title="Press to Send Notification"
  //     onPress={async () => {
  //       await sendPushNotification(expoPushToken);
  //     }}
  //   />
  // </View>
}
