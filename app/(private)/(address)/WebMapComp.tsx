import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import React, { memo, useEffect, useState } from "react";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import WebView from "react-native-webview";
import { baseUrl, hostUrl } from "@/redux/constants";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { fetchLocation } from "./utils";
import { setCurrentAddressData } from "@/redux/features/addressSlice";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/Colors";
import { showToast } from "@/utils/utils";

const WebMapComp = ({
  latitude,
  longitude,
}: {
  latitude: any;
  longitude: any;
}) => {
  
  const token = useSelector((state: RootState) => state?.auth?.token);
  const [isLoading, setIsLoading] = useState(true);
  const currentAddressData = useSelector(
    (state: RootState) => state?.address?.currentAddressData
  );
  const dispatch = useDispatch();
  const [loc, setLoc] = useState<any>(null);
  useEffect(() => {
    console.log("latitude34567890-0987654");
    fetchLocation1();
  }, []);

  const fetchLocation1 = async () => {
    try {
      let locInfo =
        latitude && longitude
          ? {
              latitude: parseFloat(latitude as string),
              longitude: parseFloat(longitude as string),
            }
          : await fetchLocation();
      setLoc(locInfo);
    } catch (err) {
      console.log("err", err);
      showToast({
        text2: err?.message || "Error fetching location",
        type: "error",
      });
      setIsLoading(false);
      router.back();
    }
  };
  console.log("loc", loc);
  return (
    <ScreenSafeWrapper title="Select Address">
      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={Colors.light.lightGreen} />
          <Text style={styles.loaderText}>Loading map...</Text>
        </View>
      )}
      <View style={{ flex: 1, marginTop: 20 }}>
        {loc && (
          <WebView
            onContentSizeChange={(event) => {
              console.log("onContentSizeChange", event);
            }}
            onLoad={() => {
              console.log("onLoad");
              setIsLoading(false);
            }}
            cacheEnabled={true}
            onLoadStart={() => {
              console.log("onLoadStart");
              setIsLoading(true);
            }}
            onLoadEnd={() => {
              console.log("onLoadEnd");
              setIsLoading(false);
            }}
            // onLoadProgress={() => {
            //   console.log("onLoadProgress");
            //   setIsLoading(true);
            // }}
            onError={() => {
              setIsLoading(false);
            }}
            onHttpError={() => {
              setIsLoading(false);
            }}
            source={{
              uri: `${hostUrl}/addressMap?lat=${loc?.latitude}&lng=${loc?.longitude}`,
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                console.log("Received location:", data);
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
                //here can i send data to addAddress.tsx using router.back
              } catch (err) {
                console.error("Invalid JSON from WebView", err);
              }
            }}
            style={{ flex: 1, borderRadius: 20, overflow: "hidden" }}
          />
        )}
      </View>
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
