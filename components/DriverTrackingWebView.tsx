// DriverTrackingWebView.tsx
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { hostUrl } from "@/redux/constants";
import MapLoaderSkeleton, {
  DEFAULT_MAP_LOADER_HEIGHT,
} from "@/components/MapLoaderSkeleton";

interface DriverTrackingWebViewProps {
  orderId: string;
  height?: number;
  fullBleed?: boolean;
}

const DriverTrackingWebView: React.FC<DriverTrackingWebViewProps> = ({
  orderId,
  height,
  fullBleed = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const mapHeight = height ?? DEFAULT_MAP_LOADER_HEIGHT;

  const url = `${hostUrl?.replace("/api", "")}/liveMap?orderId=${encodeURIComponent(orderId)}`;
  return (
    <View
      style={[
        styles.container,
        fullBleed && styles.containerFullBleed,
        { height: mapHeight },
      ]}
    >
      <WebView
        source={{ uri: url }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={[styles.webview, { height: mapHeight }]}
        onError={() => {
          setIsLoading(false);
        }}
        onLoadEnd={() => {
          setIsLoading(false);
        }}
      />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <MapLoaderSkeleton height={mapHeight} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  containerFullBleed: {
    borderRadius: 0,
    width: "100%",
  },
  webview: {
    width: "100%",
    backgroundColor: "transparent",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
});

export default DriverTrackingWebView;
