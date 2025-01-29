import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND_NOTIFICATION_TASK";

export const setupNotifications = () => {
  TaskManager.defineTask(
    BACKGROUND_NOTIFICATION_TASK,
    async ({ data, error }) => {
      if (error) {
        console.error("Error in background task", error);
        return;
      }

      let notData = null;
      if (!data?.data?.title && data?.data?.body) {
        try {
          notData = JSON.parse(data.data.body);
          const existingData = JSON.parse(
            (await AsyncStorage.getItem("notificationData")) || "[]"
          );
          const updatedData = [...existingData, notData];
          await AsyncStorage.setItem(
            "notificationData",
            JSON.stringify(updatedData)
          );
        } catch (e) {
          console.error("Error processing notification data:", e);
        }
      }
    }
  );

  Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
}; 