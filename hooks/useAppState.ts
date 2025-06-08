import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

const useAppState = () => {
  const appState = useRef(AppState.currentState); // Tracks the current app state
  const [appStateVisible, setAppStateVisible] = useState<AppStateStatus>(
    appState.current
  ); // For reactivity

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Check if app is transitioning from background/inactive to active
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
       // console.log("App has come to the foreground!");
      }

      appState.current = nextAppState; // Update the current state reference
      setAppStateVisible(nextAppState); // Trigger state update
     // console.log("AppState changed to:", nextAppState);
    };

    // Add listener
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      // Cleanup listener
      subscription.remove();
    };
  }, []);

  return appStateVisible; // Expose the current app state
};

export default useAppState;
