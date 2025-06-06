import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useRef, useState } from "react";
import { WebView } from "react-native-webview";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

const Khata = ({ url, canGoBack, setCanGoBack }) => {
  const webViewRef = useRef(null);
  const [webViewLoad, setWebViewLoad] = useState(true);

  const handleGoBack = () => {
    if (webViewRef.current && canGoBack) {
      webViewRef.current?.goBack(); // Use the WebView reference to go back
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {webViewLoad && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.light.lightGreen} />
        </View>
      )}
      {canGoBack && (
        <TouchableOpacity
          onPress={() => {
            handleGoBack();
          }}
          style={{ padding: 20, alignSelf: "flex-end", marginRight: 10 }}
        >
          <Ionicons name="close" size={24} color={"black"} />
        </TouchableOpacity>
      )}
      <WebView
        ref={webViewRef}
        onLoadStart={() => {
          setWebViewLoad(true);
        }}
        onLoadEnd={() => {
          setWebViewLoad(false);
        }}
        pullToRefreshEnabled
        bounces
        decelerationRate={1}
        allowsBackForwardNavigationGestures
        style={styles.container}
        source={{
          uri: url,
        }}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
        }}
      />
    </View>
  );
};

export default Khata;

const styles = StyleSheet.create({
  container: {
    flex: 1,

    // marginTop: Constants.statusBarHeight,
  },
  loaderContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 100,
    justifyContent: "center", // Center the loader vertically
    alignItems: "center", // Center the loader horizontally
    // backgroundColor: "rgba(255, 255, 255, 0.7)", // Optional: semi-transparent background
  },
});
