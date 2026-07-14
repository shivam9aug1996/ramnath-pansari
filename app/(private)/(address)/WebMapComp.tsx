import { ActivityIndicator, AppState, StyleSheet, Text, View } from "react-native";
import { devError, devLog } from "@/utils/devLog";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import WebView from "react-native-webview";
import { hostUrl } from "@/redux/constants";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { fetchLocation } from "./utils";
import { setCurrentAddressData } from "@/redux/features/addressSlice";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";
import TryAgain from "../(category)/CategoryList/TryAgain";
import {
  LocationPermissionError,
  openAppSettings,
} from "@/utils/locationPermission";

const WebMapComp = ({
  latitude,
  longitude,
}: {
  latitude: any;
  longitude: any;
}) => {
  const token = useSelector((state: RootState) => state?.auth?.token);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [needsSettings, setNeedsSettings] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const currentAddressData = useSelector(
    (state: RootState) => state?.address?.currentAddressData
  );
  const dispatch = useDispatch();
  const [loc, setLoc] = useState<any>(null);
  const wasInBackground = useRef(false);

  const fetchLocation1 = useCallback(async () => {
    setLoadError(null);
    setNeedsSettings(false);
    setIsLoading(true);
    try {
      const deviceLocation = await fetchLocation();
      setCurrentLocation(deviceLocation);
      const locInfo =
        latitude && longitude
          ? {
              latitude: parseFloat(latitude as string),
              longitude: parseFloat(longitude as string),
            }
          : deviceLocation;
      setLoc(locInfo);
    } catch (err: any) {
      devLog("err", err);
      const isPermissionError = err instanceof LocationPermissionError;
      setNeedsSettings(isPermissionError && !err.canAskAgain);
      setLoadError(err?.message || "Error fetching location");
      setIsLoading(false);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    fetchLocation1();
  }, [fetchLocation1]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background" || nextState === "inactive") {
        wasInBackground.current = true;
        return;
      }
      if (nextState === "active" && wasInBackground.current && needsSettings) {
        wasInBackground.current = false;
        fetchLocation1();
      }
    });
    return () => sub.remove();
  }, [fetchLocation1, needsSettings]);

  const handleMapError = useCallback(() => {
    setLoadError("Couldn't load the map. Please try again.");
    setNeedsSettings(false);
    setIsLoading(false);
  }, []);

  const handleRetry = useCallback(() => {
    if (needsSettings) {
      openAppSettings();
      return;
    }
    setLoadError(null);
    setIsLoading(true);
    if (!loc) {
      fetchLocation1();
      return;
    }
    setMapKey((key) => key + 1);
  }, [fetchLocation1, loc, needsSettings]);

  return (
    <ScreenSafeWrapper title="Select Address">
      {loadError ? (
        <TryAgain
          refetch={handleRetry}
          title={needsSettings ? "Location permission needed" : undefined}
          message={loadError}
          actionTitle={needsSettings ? "Open Settings" : "Try Again"}
        />
      ) : (
        <>
          {isLoading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color={Colors.light.lightGreen} />
              <Text style={styles.loaderText}>Loading map...</Text>
            </View>
          )}
          <View style={{ flex: 1, marginTop: 20 }}>
            {loc && (
              <WebView
                key={mapKey}
                cacheMode="LOAD_CACHE_ELSE_NETWORK"
                onContentSizeChange={(event) => {
                  devLog("onContentSizeChange", event);
                }}
                onLoad={() => {
                  devLog("onLoad");
                  setIsLoading(false);
                }}
                cacheEnabled={true}
                onLoadStart={() => {
                  devLog("onLoadStart");
                  setIsLoading(true);
                }}
                onLoadEnd={() => {
                  devLog("onLoadEnd");
                  setIsLoading(false);
                }}
                onError={handleMapError}
                onHttpError={handleMapError}
                source={{
                  uri: `${hostUrl}/addressMap?lat=${loc?.latitude}&lng=${loc?.longitude}&cLat=${currentLocation?.latitude}&cLng=${currentLocation?.longitude}`,
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                }}
                onMessage={(event) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    devLog("Received location:", data);
                    dispatch(
                      setCurrentAddressData({
                        ...currentAddressData,
                        form: {
                          ...currentAddressData?.form,
                          address: data.address,
                          latitude: data?.lat,
                          longitude: data?.lng,
                        },
                      })
                    );
                    router.back();
                  } catch (err) {
                    devError("Invalid JSON from WebView", err);
                  }
                }}
                style={{ flex: 1, borderRadius: 20, overflow: "hidden" }}
              />
            )}
          </View>
        </>
      )}
    </ScreenSafeWrapper>
  );
};

export default memo(WebMapComp);

const styles = StyleSheet.create({
  loaderContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    flex: 1,
  },
  loaderText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light.lightGreen,
  },
});
