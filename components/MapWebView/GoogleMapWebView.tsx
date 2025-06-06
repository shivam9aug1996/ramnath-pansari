import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, Platform } from "react-native";
import { WebView } from "react-native-webview";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import Map from "./Map";

const GoogleMapWebView = () => {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [address, setAddress] = useState<string>("");

  const sendData = ({ latitude, longitude, address }) => {
    setLocation({ latitude, longitude });
    setAddress(address);
  };

  return (
    <ScreenSafeWrapper
      wrapperStyle={{ paddingHorizontal: 0 }}
      headerStyle={{ paddingHorizontal: 16 }}
    >
      <View style={{ flex: 1 }}>
        {location && (
          <ScrollView
          bounces={Platform.OS === "android" ? false : true}
            style={styles.locationInfo}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View>
              <Text>Latitude: {location.latitude}</Text>
              <Text>Longitude: {location.longitude}</Text>
              <Text>Address: {address || "Address not found"}</Text>
            </View>
          </ScrollView>
        )}
        <Map sendData={sendData} />
      </View>
    </ScreenSafeWrapper>
  );
};

const styles = StyleSheet.create({
  locationInfo: {
    position: "absolute",
    // bottom: 10,
    // left: 10,
    backgroundColor: "pink",
    padding: 10,
    borderRadius: 5,
    color: "white",
    minHeight: 100,
    maxHeight: 100,
    zIndex: 10,
    width: "100%",
    // paddingVertical: 10,
    //  overflow: "scroll",
  },
});

export default GoogleMapWebView;
