import {
  ActivityIndicator,
  AppState,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { devError, devLog } from "@/utils/devLog";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { hostUrl } from "@/redux/constants";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { fetchLocation } from "./utils";
import { setCurrentAddressData } from "@/redux/features/addressSlice";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";
import { DEFAULT_DELIVERY_RADIUS } from "@/constants/StoreConfig";
import TryAgain from "../(category)/CategoryList/TryAgain";
import {
  LocationPermissionError,
  openAppSettings,
} from "@/utils/locationPermission";
import AddressMapEmbed from "@/components/address/AddressMapEmbed";

function parseCoordPair(latitude: unknown, longitude: unknown) {
  const lat = parseFloat(String(latitude ?? ""));
  const lng = parseFloat(String(longitude ?? ""));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { latitude: lat, longitude: lng };
}

const FALLBACK_LOC = {
  latitude: DEFAULT_DELIVERY_RADIUS.centerLatitude,
  longitude: DEFAULT_DELIVERY_RADIUS.centerLongitude,
};

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
    (state: RootState) => state?.address?.currentAddressData,
  );
  const dispatch = useDispatch();
  const paramLoc = useMemo(
    () => parseCoordPair(latitude, longitude),
    [latitude, longitude],
  );
  const [loc, setLoc] = useState<any>(
    () => paramLoc ?? (Platform.OS === "web" ? FALLBACK_LOC : null),
  );
  const wasInBackground = useRef(false);

  const fetchLocation1 = useCallback(async () => {
    setLoadError(null);
    setNeedsSettings(false);
    if (Platform.OS !== "web" && !paramLoc) {
      setIsLoading(true);
    }
    try {
      const deviceLocation = await fetchLocation();
      setCurrentLocation(deviceLocation);
      setLoc(paramLoc ?? deviceLocation);
    } catch (err: any) {
      devLog("err", err);
      // Web: still show the map (store center). GPS is best-effort.
      if (Platform.OS === "web") {
        setLoc(paramLoc ?? FALLBACK_LOC);
        return;
      }
      if (paramLoc) {
        setLoc(paramLoc);
        return;
      }
      const isPermissionError = err instanceof LocationPermissionError;
      setNeedsSettings(isPermissionError && !err.canAskAgain);
      setLoadError(err?.message || "Error fetching location");
      setIsLoading(false);
    }
  }, [paramLoc]);

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

  const handleMapLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleMapLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleRetry = useCallback(() => {
    // Native: open OS settings when permanently denied.
    // Web: browsers can't deep-link site settings — user enables via lock icon, then retries.
    if (needsSettings && Platform.OS !== "web") {
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

  const mapUri = useMemo(() => {
    if (!loc) return "";
    return `${hostUrl}/addressMap?lat=${loc.latitude}&lng=${loc.longitude}&cLat=${currentLocation?.latitude}&cLng=${currentLocation?.longitude}`;
  }, [loc, currentLocation?.latitude, currentLocation?.longitude]);

  const handleLocationMessage = useCallback(
    (raw: string) => {
      try {
        const data = JSON.parse(raw);
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
          }),
        );
        router.back();
      } catch (err) {
        devError("Invalid JSON from map embed", err);
      }
    },
    [currentAddressData, dispatch],
  );

  return (
    <ScreenSafeWrapper title="Select Address">
      {loadError ? (
        <TryAgain
          refetch={handleRetry}
          title={needsSettings ? "Location permission needed" : undefined}
          message={loadError}
          actionTitle={
            needsSettings && Platform.OS !== "web" ? "Open Settings" : "Try Again"
          }
        />
      ) : (
        <View style={styles.mapArea}>
          {loc && mapUri ? (
            <AddressMapEmbed
              uri={mapUri}
              mapKey={mapKey}
              authToken={token}
              isLoading={isLoading}
              onLoadStart={handleMapLoadStart}
              onLoadEnd={handleMapLoadEnd}
              onError={handleMapError}
              onLocationMessage={handleLocationMessage}
            />
          ) : (
            <View style={styles.centeredFill}>
              <ActivityIndicator size="small" color={Colors.light.lightGreen} />
              <Text style={styles.loaderText}>Loading map...</Text>
            </View>
          )}
        </View>
      )}
    </ScreenSafeWrapper>
  );
};

export default memo(WebMapComp);

const styles = StyleSheet.create({
  mapArea: {
    flex: 1,
    marginTop: 20,
    minHeight: 0,
  },
  centeredFill: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light.lightGreen,
  },
});
