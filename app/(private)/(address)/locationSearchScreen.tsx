import { StyleSheet, Text, View } from "react-native";
import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { router, useFocusEffect } from "expo-router";
import { Colors } from "@/constants/Colors";
import { Keyboard } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentAddressData } from "@/redux/features/addressSlice";
import { RootState } from "@/types/global";

const locationSearchScreen = () => {
  const boxRef = useRef("");
  const currentAddressData = useSelector(
    (state: RootState) => state?.address?.currentAddressData
  );
  const dispatch = useDispatch();

  useFocusEffect(
    useCallback(() => {
      let timeoutId = setTimeout(() => {
        boxRef?.current?.focus();
      }, 200);

      return () => {
        clearTimeout(timeoutId); // Clear the timeout on cleanup
      };
    }, [])
  );
  return (
    <ScreenSafeWrapper title="Search Location">
      <GooglePlacesAutocomplete
        ref={boxRef}
        styles={{
          textInputContainer: {
            borderRadius: 20,
            paddingVertical: 6,
            position: "relative",
            backgroundColor: "#f2f4f3",
            marginTop: 20,
          },
          textInput: {
            fontFamily: "Raleway_600SemiBold",
            fontSize: 14,
            color: Colors.light.darkGreen,
            backgroundColor: "#f2f4f3",
            borderRadius: 20,
          },
        }}
        renderLeftButton={() => <View style={{ width: 15 }}></View>}
        placeholder="Search"
        fetchDetails={true}
        onPress={(data, details = null) => {
          // 'details' is provided when fetchDetails = true
         // console.log("jhgfdsdfghjkl;", data);
          //console.log("jhgfdsdfgh56789jkl;", details);
          const latitude = details?.geometry?.location?.lat;
          const longitude = details?.geometry?.location?.lng;
          dispatch(
            setCurrentAddressData({
              ...currentAddressData,
              form: {
                ...currentAddressData?.form,
                latitude,
                longitude,
              },
            })
          );

          router.back();
        }}
        query={{
          key: "AIzaSyCY7OexW8I25uKjtJwqU1hAQZAZ4d8bnqQ",
          language: "en",
          components: "country:in",
        }}
      />
    </ScreenSafeWrapper>
  );
};

export default locationSearchScreen;

const styles = StyleSheet.create({});
