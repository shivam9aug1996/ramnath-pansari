import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

export const useNotificationObserver = () => {
  useEffect(() => {
    let isMounted = true;

    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url;
      if (url) {
        // router.push(url);
        console.log("765redfghjk", url);
      }
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response?.notification) {
        return;
      }
      console.log("getLastNotificationResponseAsync 765redfghjk", response);
      // redirect(response?.notification);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("response 765redfghjk", response);
        //redirect(response.notification);
      }
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
};
