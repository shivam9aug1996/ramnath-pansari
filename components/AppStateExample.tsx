import {
  orderApi,
  useFetchOrdersQuery,
  useLazyFetchOrdersQuery,
} from "@/redux/features/orderSlice";
import { RootState } from "@/types/global";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useRef, useState, useEffect } from "react";
import { AppState, StyleSheet, Text } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

const AppStateExample = () => {
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const dispatch = useDispatch();
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (nextAppState === "background") {
         // console.log("App has gone to the background!");
          // Example: Save app state or perform cleanup
          await AsyncStorage.setItem("notificationData", JSON.stringify([]));
        }

        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
         // console.log("App has come to the foreground!");
          // AsyncStorage.removeItem("notificationData");
          const storedData = JSON.parse(
            (await AsyncStorage.getItem("notificationData")) || "[]"
          );
          // await new Promise((res) => {
          //   setTimeout(() => {
          //     res("hi");
          //   }, 1000);
          // });
        //  console.log("jhgfdfghjk", storedData);
          storedData?.forEach(async (item) => {
            if (item?.updateOrderStatus) {
             // console.log("jhgfdcvbnm,./", item);

              dispatch(
                orderApi.util.invalidateTags([
                  {
                    type: "detailOrder",
                    id: `${item?.orderId}-${item?.userId}`,
                  },
                ])
              );

              dispatch(
                orderApi.util.invalidateTags([
                  { type: "orderList", id: `${item?.userId}` },
                ])
              );
            }
          });
          await AsyncStorage.removeItem("notificationData");
         // console.log(storedData);
        }

        appState.current = nextAppState;
        setAppStateVisible(appState.current);
       // console.log("AppState", appState.current);
      }
    );

    return () => {
      subscription.remove();
    };
  }, [userId]);

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AppStateExample;
