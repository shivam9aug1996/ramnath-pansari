import React, { memo, useEffect, useMemo } from "react";
import { devError, devLog, devWarn } from "@/utils/devLog";
import { View } from "react-native";
import WebView from "react-native-webview";
import { useDispatch, useSelector } from "react-redux";
import { hostUrl } from "@/redux/constants";
import { RootState } from "@/types/global";
import { fetchLocation } from "./utils";

const DEFAULT_LAT = 28.709560;
const DEFAULT_LNG = 77.651730;

type Props = {
  latitude?: string;
  longitude?: string;
};

const MapPreloader = ({ latitude, longitude }: Props) => {
    devLog("mappreloader1234567890");
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state?.auth?.token);

  const mapLat = useMemo(() => {
    const parsed = parseFloat(latitude || "");
    return Number.isFinite(parsed) ? parsed : DEFAULT_LAT;
  }, [latitude]);

  const mapLng = useMemo(() => {
    const parsed = parseFloat(longitude || "");
    return Number.isFinite(parsed) ? parsed : DEFAULT_LNG;
  }, [longitude]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        //const loc = await fetchLocation();
        // if (!cancelled) {
        //   dispatch(setMapPreload({ currentLocation: loc }));
        // }
      } catch {
        // ignore — WebMapComp will retry
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  if (!token) {
    return null;
  }


  return (
    <View
      pointerEvents="none"
      style={{
        width: 1,
        height: 1,
        opacity: 0,
        position: "absolute",
        top: -1000,
        left: -1000,
      }}
    >
      <WebView
        cacheEnabled
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        javaScriptEnabled
        source={{
          uri: `${hostUrl}/addressMap?lat=${mapLat}&lng=${mapLng}&cLat=${mapLat}&cLng=${mapLng}`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }}
        onLoadEnd={() => {
         // dispatch(setMapPreload({ mapCacheReady: true }));
        }}
        onError={() => {
         // dispatch(setMapPreload({ mapCacheReady: false }));
        }}
      />
    </View>
  );
};

export default memo(MapPreloader);