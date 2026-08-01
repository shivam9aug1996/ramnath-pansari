import { Platform } from "react-native";
import React, { useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import AppHead from "@/components/AppHead";
import WebMapComp from "./WebMapComp";
import { hostUrl } from "@/redux/constants";
import { devLog } from "@/utils/devLog";

const WebMap = () => {
  const params = useLocalSearchParams();
  const { latitude, longitude } = params;

  useEffect(() => {
    const origin =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.location.href
        : "(native)";
    const secureContext =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.isSecureContext
        : null;
    const geo =
      Platform.OS === "web" && typeof navigator !== "undefined"
        ? !!navigator.geolocation
        : null;

    devLog("[WebMap] mount", {
      platform: Platform.OS,
      origin,
      hostUrl,
      latitude,
      longitude,
      allParams: params,
      isSecureContext: secureContext,
      hasGeolocation: geo,
    });

    return () => {
      devLog("[WebMap] unmount");
    };
    // Log once on mount with the params we navigated with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    devLog("[WebMap] params changed", { latitude, longitude });
  }, [latitude, longitude]);

  return (
    <>
      <AppHead title="Select Address" />
      <WebMapComp latitude={latitude} longitude={longitude} />
    </>
  );
};

export default WebMap;
