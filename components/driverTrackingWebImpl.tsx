import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import MapLoaderSkeleton, {
  DEFAULT_MAP_LOADER_HEIGHT,
} from "@/components/MapLoaderSkeleton";
import TryAgain from "@/app/(private)/(category)/CategoryList/TryAgain";
import {
  buildLiveMapUrl,
  type DriverTrackingWebViewProps,
} from "./DriverTrackingWebView.shared";

const LOAD_TIMEOUT_MS = 15_000;

const DriverTrackingWebView: React.FC<DriverTrackingWebViewProps> = ({
  orderId,
  height,
  fullBleed = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const mapHeight = height ?? DEFAULT_MAP_LOADER_HEIGHT;
  const url = useMemo(() => buildLiveMapUrl(orderId), [orderId, mapKey]);
  const finishedRef = useRef(false);
  const listenersCleanupRef = useRef<(() => void) | null>(null);

  const markLoaded = useCallback(
    (reason: string) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setIsLoading(false);
    },
    [url],
  );

  const markError = useCallback(
    (reason: string, detail?: unknown) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      console.warn("[live-map] error", { reason, url, detail });
      setLoadError("Couldn't load live tracking. Please try again.");
      setIsLoading(false);
    },
    [url],
  );

  const handleRetry = useCallback(() => {
    finishedRef.current = false;
    listenersCleanupRef.current?.();
    listenersCleanupRef.current = null;
    setLoadError(null);
    setIsLoading(true);
    setMapKey((key) => key + 1);
  }, [orderId]);

  const setIframeNode = useCallback(
    (node: HTMLIFrameElement | null) => {
      listenersCleanupRef.current?.();
      listenersCleanupRef.current = null;
      if (!node) {
        return;
      }

      const onLoad = () => markLoaded("dom_load");
      const onError = () => markError("dom_error");
      node.addEventListener("load", onLoad);
      node.addEventListener("error", onError);
      listenersCleanupRef.current = () => {
        node.removeEventListener("load", onLoad);
        node.removeEventListener("error", onError);
      };
    },
    [markLoaded, markError],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!finishedRef.current) {
        markError("timeout");
      }
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [mapKey, markError]);

  useEffect(() => {
    return () => {
      listenersCleanupRef.current?.();
      listenersCleanupRef.current = null;
    };
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
          title="Couldn't load map"
          message={loadError}
          compact
        />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <iframe
        key={mapKey}
        ref={setIframeNode}
        src={url}
        title="Live delivery tracking"
        style={{
          width: "100%",
          height: mapHeight,
          border: "none",
          display: "block",
          borderRadius: fullBleed ? 0 : 16,
        }}
        onLoad={() => markLoaded("react_onLoad")}
        onError={() => markError("react_onError")}
      />
      {isLoading ? (
        <View style={styles.loadingContainer} pointerEvents="none">
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
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    zIndex: 1,
  },
});

export default DriverTrackingWebView;
