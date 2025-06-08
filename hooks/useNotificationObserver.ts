import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";

export const useNotificationObserver = () => {
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);

  useEffect(() => {
    if (lastNotificationResponse && userId) {
      //console.log(
        "lastNotificationResponse",
        JSON.stringify(lastNotificationResponse)
      );
      let notData =
        lastNotificationResponse?.notification?.request?.content?.data;
      if (notData?.body) {
        notData = JSON.parse(notData?.body);
      }
      if (notData?.updateOrderStatus) {
       // console.log("kjhgfdfghjkpo0987");

        const timer = setTimeout(() => {
          router.navigate(`/(orderDetail)/${notData.orderId}`);
        }, 1000);
        return () => {
          clearTimeout(timer);
        };
      }
    }
  }, [lastNotificationResponse, userId]);

  useEffect(() => {
    let isMounted = true;

    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url;
      if (url) {
        // router.push(url);
       // console.log("765redfghjk", url);
      }
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response?.notification) {
        return;
      }
     // console.log(
        "getLastNotificationResponseAsync 765redfghjk",
        JSON.stringify(response)
      );

      if (userId) {
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
       // console.log("response 765redfghjk", response);
        //redirect(response.notification);
      }
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [userId]);
};
