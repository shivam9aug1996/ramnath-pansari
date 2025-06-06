import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

const GoogleMapWebView = () => {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: "https://www.google.com/maps" }}
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default GoogleMapWebView;
