import { StyleSheet, Text, View } from "react-native";
import React, { memo } from "react";
import WebView from "react-native-webview";

const Map = ({ sendData }) => {
  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;

    // Parse URL for coordinates and address
    const coordinatesRegex = /@([\d.-]+),([\d.-]+),/;
    const match = url.match(coordinatesRegex);
    let latitude = null;
    let longitude = null;
    let address = "";
    if (match) {
      latitude = parseFloat(match[1]);
      longitude = parseFloat(match[2]);
      //setLocation({ latitude, longitude });
    }

    // Extract address if possible (from URL or via API)
    const addressRegex = /place\/([^/]+)\//;
    const addressMatch = url.match(addressRegex);
    console.log("uytfvbnm,.", url);
    if (addressMatch) {
      address = decodeURIComponent(addressMatch[1].replace(/\+/g, " "));
      // setAddress(decodeURIComponent(addressMatch[1].replace(/\+/g, " ")));
    }
    sendData({ latitude, longitude, address });
  };
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: "https://www.google.com/maps" }}
        style={styles.webview}
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
        onNavigationStateChange={handleNavigationStateChange}
      />
    </View>
  );
};

export default memo(Map);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
  },
  webview: {
    flex: 1,
  },
});
