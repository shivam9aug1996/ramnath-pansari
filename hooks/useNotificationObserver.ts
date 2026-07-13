import { useEffect } from "react";
import { devError, devLog, devWarn } from "@/utils/devLog";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";

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

export const useNotificationObserver = () => {
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);

  useEffect(() => {
    if (!lastNotificationResponse || !userId) return;

    const notData = parseNotificationPayload(
      lastNotificationResponse?.notification?.request?.content?.data as
        | Record<string, unknown>
        | undefined
    );

    if (notData?.updateOrderStatus && notData?.orderId) {
      const timer = setTimeout(() => {
        try {
          router.push(`/(orderDetail)/${notData.orderId}`);
        } catch (error) {
          devWarn("Notification navigation failed:", error);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lastNotificationResponse, userId]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      () => {
        // Handled in Push1
      }
    );

    return () => subscription.remove();
  }, []);
};
