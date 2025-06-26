// components/WebMapRenderer.tsx
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import WebView from "react-native-webview";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { setCurrentAddressData } from "@/redux/features/addressSlice";
import { Colors } from "@/constants/Colors";
import { hostUrl } from "@/redux/constants";
import { showToast } from "@/utils/utils";
import { fetchLocation } from "./utils";

type Props = {
  visible?: boolean; // whether to show or hide the WebView
  latitude?: string;
  longitude?: string;
  onDone?: () => void;
};

const WebMapRenderer = ({ visible = true, latitude, longitude, onDone }: Props) => {
  const token = useSelector((state: RootState) => state?.auth?.token);
  const currentAddressData = useSelector((state: RootState) => state?.address?.currentAddressData);
  const dispatch = useDispatch();

  const [loc, setLoc] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLocation1();
    return () => {
    console.log("unmount")
    }
  }, []);

  const fetchLocation1 = async () => {
    try {
      const locInfo = latitude && longitude
        ? {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
          }
        : await fetchLocation();

      setLoc(locInfo);
    } catch (err) {
      console.log("err", err);
     if(visible){
        showToast({
            text2: err?.message || "Error fetching location",
            type: "error",
          });
     }
     setError(err?.message || "Error fetching location");
      setIsLoading(false);
    }
  };


  console.log("isLoading",isLoading)

  if (!visible) {
    return null;
  }

  if (!loc) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.light.gradientGreen_2} />
      </View>
    );
  }

//   if(isLoading){
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" color={Colors.light.gradientGreen_2} />
//       </View>
//     );
//   }

  return (
    <WebView
    cacheEnabled={true}
    onLoadStart={() => {
        console.log("onLoadStart");
        setIsLoading(true);
      }}
      onLoadEnd={() => {
        console.log("onLoadEnd");
        setIsLoading(false);
      }}
      onLoadProgress={() => {
        console.log("onLoadProgress");
        setIsLoading(true);
      }}
      onError={()=>{
        setIsLoading(false);
      }}
      onHttpError={()=>{
        setIsLoading(false);
      }}
      source={{
        uri: `${hostUrl}/addressMap?lat=${loc.latitude}&lng=${loc.longitude}`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }}
      onMessage={(event) => {
        try {
          const data = JSON.parse(event.nativeEvent.data);
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
          onDone?.(); // callback to go back or do something
        } catch (err) {
          console.error("Invalid JSON from WebView", err);
        }
      }}
      style={{
        flex: 1,
        borderRadius: 20,
        overflow: "hidden",
        display: visible ? "flex" : "none",
        marginTop:20
      }}
    />
  );
};

export default WebMapRenderer;
