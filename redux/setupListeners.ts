import { ThunkDispatch, createAction } from "@reduxjs/toolkit";
import { addNetworkStateListener } from "expo-network";
import {
  Platform,
  AppState,
  AppStateStatus,
  NativeEventSubscription,
} from "react-native";
import { type EventSubscription } from "expo-modules-core";

export const onFocus = createAction("__rtkq/focused");
export const onFocusLost = createAction("__rtkq/unfocused");
export const onOnline = createAction("__rtkq/online");
export const onOffline = createAction("__rtkq/offline");

let initialized: Boolean = false;

export function setupListeners(
  dispatch: ThunkDispatch<any, any, any>,
  customHandler?: (
    dispatch: ThunkDispatch<any, any, any>,
    actions: {
      onFocus: typeof onFocus;
      onFocusLost: typeof onFocusLost;
      onOnline: typeof onOnline;
      onOffline: typeof onOffline;
    }
  ) => () => void
) {
  const mobileDefaultHandler = () => {
    const handleFocus = () => dispatch(onFocus());
    const handleFocusLost = () => dispatch(onFocusLost());
    const handleOnline = () => dispatch(onOnline());
    const handleOffline = () => dispatch(onOffline());

    let unsubscribeAppState: NativeEventSubscription;
    let networkSubscription: EventSubscription;

    if (!initialized) {
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          handleFocus();
        } else {
          handleFocusLost();
        }
      };

      unsubscribeAppState = AppState.addEventListener(
        "change",
        handleAppStateChange
      );

      networkSubscription = addNetworkStateListener(
        ({ type, isConnected, isInternetReachable }) => {
          if (isConnected && isInternetReachable) {
            handleOnline();
          } else {
            handleOffline();
          }
          //console.log(
            `Network type: ${type}, Connected: ${isConnected}, Internet Reachable: ${isInternetReachable}`
          );
        }
      );

      initialized = true;
    }

    const unsubscribe = () => {
      if (unsubscribeAppState) unsubscribeAppState.remove();
      if (networkSubscription) networkSubscription.remove();
      initialized = false;
    };

    return unsubscribe;
  };

  const webDefaultHandler = () => {
    const handleFocus = () => dispatch(onFocus());
    const handleFocusLost = () => dispatch(onFocusLost());
    const handleOnline = () => dispatch(onOnline());
    const handleOffline = () => dispatch(onOffline());
    const handleVisibilityChange = () => {
      if (window.document.visibilityState === "visible") {
        handleFocus();
      } else {
        handleFocusLost();
      }
    };

    if (!initialized) {
      if (typeof window !== "undefined" && window.addEventListener) {
        // Handle focus events
        window.addEventListener(
          "visibilitychange",
          handleVisibilityChange,
          false
        );
        window.addEventListener("focus", handleFocus, false);

        // Handle connection events
        window.addEventListener("online", handleOnline, false);
        window.addEventListener("offline", handleOffline, false);
        initialized = true;
      }
    }
    const unsubscribe = () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      initialized = false;
    };
    return unsubscribe;
  };

  return customHandler
    ? customHandler(dispatch, { onFocus, onFocusLost, onOffline, onOnline })
    : Platform.OS === "web"
    ? webDefaultHandler()
    : mobileDefaultHandler();
}
