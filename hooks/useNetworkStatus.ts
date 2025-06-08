import {
  addNetworkStateListener,
  getNetworkStateAsync,
  NetworkStateType,
} from "expo-network";
import { useState, useEffect } from "react";

const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState({
    type: undefined,
    isConnected: undefined,
    isInternetReachable: undefined,
  });

  useEffect(() => {
    const checkConnection = async () => {
      const data = await getNetworkStateAsync();
      setNetworkState(data);
     // console.log("yghjkl", data);
    };
    checkConnection();
  }, []);

  useEffect(() => {
    // Subscribe to network state changes
    const subscription = addNetworkStateListener(
      ({ type, isConnected, isInternetReachable }) => {
        // console.log(
        //   `Network type: ${type}, Connected: ${isConnected}, Internet Reachable: ${isInternetReachable}`
        // );
        setNetworkState({
          type,
          isConnected,
          isInternetReachable,
        });
      }
    );

    // Cleanup on unmount
    return () => {
      subscription.remove();
    };
  }, []);

  return networkState;
};

export default useNetworkStatus;
