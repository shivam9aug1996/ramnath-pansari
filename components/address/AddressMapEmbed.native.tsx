import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import WebView from "react-native-webview";
import { Colors } from "@/constants/Colors";
import { devLog } from "@/utils/devLog";
import type { AddressMapEmbedProps } from "./AddressMapEmbed.types";

/**
 * On Android, WebView's native surface paints above sibling RN views, so an
 * overlay spinner only shows in gaps (often the bottom). While loading we
 * keep the spinner in normal flex layout and shrink the WebView to 1×1.
 */
export default function AddressMapEmbed({
  uri,
  mapKey,
  authToken,
  isLoading = true,
  onLoadStart,
  onLoadEnd,
  onError,
  onLocationMessage,
}: AddressMapEmbedProps) {
  return (
    <View style={styles.wrap} collapsable={false}>
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={Colors.light.lightGreen} />
          <Text style={styles.loaderText}>Loading map...</Text>
        </View>
      ) : null}
      <WebView
        key={mapKey}
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        onContentSizeChange={(event) => {
          devLog("onContentSizeChange", event);
        }}
        onLoad={() => {
          devLog("onLoad");
          onLoadEnd();
        }}
        cacheEnabled
        onLoadStart={() => {
          devLog("onLoadStart");
          onLoadStart();
        }}
        onLoadEnd={() => {
          devLog("onLoadEnd");
          onLoadEnd();
        }}
        onError={onError}
        onHttpError={onError}
        source={{
          uri,
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        }}
        onMessage={(event) => {
          onLocationMessage(event.nativeEvent.data);
        }}
        style={isLoading ? styles.embedLoading : styles.embed}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 0,
    borderRadius: 20,
    overflow: "hidden",
  },
  loading: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  embed: {
    flex: 1,
    backgroundColor: "transparent",
  },
  embedLoading: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    left: 0,
    top: 0,
  },
  loaderText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light.lightGreen,
  },
});
