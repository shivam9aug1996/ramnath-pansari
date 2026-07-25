import React, { useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/Colors";
import { hostUrl } from "@/redux/constants";
import { devLog } from "@/utils/devLog";
import type { AddressMapEmbedProps } from "./AddressMapEmbed.types";

function appendQueryParams(
  uri: string,
  params: Record<string, string | undefined | null>,
) {
  try {
    const url = new URL(uri);
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
    }
    return url.toString();
  } catch {
    return uri;
  }
}

export default function AddressMapEmbed({
  uri,
  mapKey,
  authToken,
  isLoading = false,
  onLoadStart,
  onLoadEnd,
  onError,
  onLocationMessage,
}: AddressMapEmbedProps) {
  const onLoadStartRef = useRef(onLoadStart);
  const onLocationMessageRef = useRef(onLocationMessage);
  onLoadStartRef.current = onLoadStart;
  onLocationMessageRef.current = onLocationMessage;

  const iframeSrc = useMemo(() => {
    const parentOrigin =
      typeof window !== "undefined" ? window.location.origin : "";
    return appendQueryParams(uri, {
      mapAuth: authToken,
      parentOrigin,
    });
  }, [uri, authToken, mapKey]);

  useEffect(() => {
    onLoadStartRef.current();
  }, [iframeSrc]);

  useEffect(() => {
    const allowedOrigin = (() => {
      try {
        return new URL(hostUrl).origin;
      } catch {
        return "";
      }
    })();

    const onMessage = (event: MessageEvent) => {
      if (allowedOrigin && event.origin !== allowedOrigin) {
        return;
      }

      let parsed: { lat?: unknown; lng?: unknown } | null = null;
      try {
        parsed =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      if (!parsed || typeof parsed !== "object") return;
      if (parsed.lat == null || parsed.lng == null) return;

      const raw =
        typeof event.data === "string"
          ? event.data
          : JSON.stringify(event.data);

      devLog("Received location (iframe):", raw);
      onLocationMessageRef.current(raw);
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <View style={styles.wrap}>
      <iframe
        key={mapKey}
        src={iframeSrc}
        title="Select address map"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          borderRadius: 20,
          display: "block",
        }}
        onLoad={() => onLoadEnd()}
        onError={() => onError()}
        allow="geolocation"
      />
      {isLoading ? (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator size="small" color={Colors.light.lightGreen} />
          <Text style={styles.loaderText}>Loading map...</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 0,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  loaderText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light.lightGreen,
  },
});
