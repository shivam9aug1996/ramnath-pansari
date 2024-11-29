import useNetworkStatus from "@/hooks/useNetworkStatus";
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const NetworkStatusComponent = () => {
  const { type, isConnected, isInternetReachable } = useNetworkStatus();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Network Type: {type || "Unknown"}</Text>
      <Text style={styles.text}>Connected: {isConnected ? "Yes" : "No"}</Text>
      <Text style={styles.text}>
        Internet Reachable:{" "}
        {isInternetReachable !== null
          ? isInternetReachable
            ? "Yes"
            : "No"
          : "Unknown"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 0.4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "red",
  },
  text: {
    fontSize: 16,
    marginVertical: 4,
  },
});

export default NetworkStatusComponent;
