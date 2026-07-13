// DriverTrackingWebView.tsx
import React, { useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { hostUrl } from "@/redux/constants";
import MapLoaderSkeleton, {
  DEFAULT_MAP_LOADER_HEIGHT,
} from "@/components/MapLoaderSkeleton";
import TryAgain from "@/app/(private)/(category)/CategoryList/TryAgain";

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const mapHeight = height ?? DEFAULT_MAP_LOADER_HEIGHT;

  const url = `${hostUrl?.replace("/api", "")}/liveMap?orderId=${encodeURIComponent(orderId)}`;

  const handleMapError = useCallback(() => {
    setLoadError("Couldn't load live tracking. Please try again.");
    setIsLoading(false);
  }, []);

  const handleRetry = useCallback(() => {
    setLoadError(null);
    setIsLoading(true);
    setMapKey((key) => key + 1);
  }, []);

  const containerStyle = [
    styles.container,
    fullBleed && styles.containerFullBleed,
    { height: mapHeight },
  ];

  if (loadError) {
    return (
      <View style={containerStyle}>
        <TryAgain
          refetch={handleRetry}
          message={loadError}
          compact
        />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <WebView
        key={mapKey}
        source={{ uri: url }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={[styles.webview, { height: mapHeight }]}
        onError={handleMapError}
        onHttpError={handleMapError}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
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
