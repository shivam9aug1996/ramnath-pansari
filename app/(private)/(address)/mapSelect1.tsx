import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import  {
  Marker,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import useFetchLocation from "./useFetchLocation";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import CustomTextInput from "@/components/CustomTextInput";
import Button from "@/components/Button";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { setCurrentAddressData } from "@/redux/features/addressSlice";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { debounce } from "lodash";
import CustomSuspense from "@/components/CustomSuspense";
import isWithinDeliveryRadius from "./utils";
import { showToast } from "@/utils/utils";
import { Colors } from "@/constants/Colors";
import MapWebView from "@/components/MapWebView";

interface LocationData {
  city: string;
  state: string;
  pincode: string;
  area: string;
  latitude: string;
  longitude: string;
}

const initialRegion: Region = {
  latitude: 28.7041,
  longitude: 77.1025,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MapSelect: React.FC = () => {
  const dispatch = useDispatch();

  const mapRef = useRef<MapView | null>(null);
  const [region, setRegion] = useState<Region>(initialRegion);
  const [data, setData] = useState<LocationData>({
    city: "",
    state: "",
    pincode: "",
    area: "",
    latitude: "",
    longitude: "",
  });
  const firstMount = useRef<boolean>(true);
  const [firstMountLoading, setFirstMountLoading] = useState(true);
  const firstEditMount = useRef<boolean>(true);
  const params = useLocalSearchParams();
  const {
    loading: fetchingLocationLoading,
    data: fetchingLocationData,
    fetchLocationData,
    reset,
  } = useFetchLocation();
  //const searchData = params;

  const currentAddressData = useSelector(
    (state: RootState) => state?.address?.currentAddressData
  );

  const itemId =
    currentAddressData?.action == "edit"
      ? currentAddressData?.form?._id
      : undefined;

  const searchData = currentAddressData?.form;
  //console.log("searchData1", searchData1);
  const updateMapRegion = useCallback(
    (latitude: number, longitude: number, animate = true) => {
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      };
      setRegion(newRegion);
      if (animate) {
        mapRef.current?.animateToRegion(newRegion, 1000);
      }
      // setTimeout(() => {
      //   firstMount.current = false;
      //   setFirstMountLoading(false);
      // }, 1000);
    },
    []
  );

  // Fetch location data or update map when searchData changes

  useEffect(() => {
    console.log("uytfdfghjkl");
    if (!searchData?.latitude) {
      fetchLocationData();
    } else if (searchData?.latitude && searchData?.longitude) {
      const latitude = parseFloat(searchData.latitude);
      const longitude = parseFloat(searchData.longitude);
      updateMapRegion(latitude, longitude);
      setTimeout(() => {
        fetchLocationData(latitude, longitude);
      }, 500);
    }
  }, [searchData?.latitude]);

  // Update map when fetching new location data
  useEffect(() => {
    if (fetchingLocationLoading === false && fetchingLocationData?.latitude) {
      if (
        fetchingLocationData?.latitude &&
        fetchingLocationData?.longitude &&
        fetchingLocationData?.hasLat == false
      ) {
        const { latitude, longitude, city, state, area, pincode } =
          fetchingLocationData;
        setData({ latitude, longitude, city, state, area, pincode });
        updateMapRegion(parseFloat(latitude), parseFloat(longitude));
      } else if (
        fetchingLocationData?.latitude &&
        fetchingLocationData?.longitude &&
        fetchingLocationData?.hasLat == true
      ) {
        const { latitude, longitude, city, state, area, pincode } =
          fetchingLocationData;
        setData({ latitude, longitude, city, state, area, pincode });
      }
    }
  }, [fetchingLocationLoading]);

  useEffect(() => {
    if (data?.latitude) {
      setTimeout(() => {
        firstMount.current = false;
        setFirstMountLoading(false);
      }, 1000);
    }
  }, [data?.latitude]);

  // const debouncedFetchLocation = useCallback(
  //   debounce(
  //     (latitude, longitude) => fetchLocationData(latitude, longitude),
  //     500
  //   ),
  //   []
  // );

  // const handleRegionChangeComplete = useCallback((region: Region) => {
  //   if (!firstMount.current) {
  //     console.log("hiiu567890");
  //     fetchLocationData(region.latitude, region.longitude);
  //   }
  // }, []);
  //console.log("8765redfghjk", currentAddressData);

  // useEffect(() => {
  //   fetchLocationData();
  // }, []);

  const debouncedFetchLocation = useCallback(
    debounce((latitude: number, longitude: number) => {
      fetchLocationData(latitude, longitude);
    }, 500),
    []
  );

  const handleRegionChangeComplete = useCallback(() => {
    if (firstMount?.current === false) {
     // console.log("hiiuy456789");
      debouncedFetchLocation(region.latitude, region.longitude);
      setFirstMountLoading(true);
      firstMount.current = true;
    }
  }, [region]);

  const handleLocationSelection = () => {
    const selectedLocation = {
      latitude: region.latitude,
      longitude: region.longitude,
    };

    if (isWithinDeliveryRadius(selectedLocation)) {
     // console.log("Location is eligible for delivery.");
      // Proceed with the selection
    } else {
     // console.log("Location is outside the delivery radius.");
      // Show a message to the user
      alert("Sorry, we only deliver within a 5 km radius.");
    }
  };

  //return <GoogleMapWebView />;
  const selectedLocation = {
    latitude: region.latitude,
    longitude: region.longitude,
  };
  const loc = isWithinDeliveryRadius(selectedLocation);
//console.log("uytrdsdfghjk",searchData,fetchingLocationLoading,firstMountLoading)
  return (
    <ScreenSafeWrapper
      useKeyboardAvoidingView
      title={`${itemId ? "Edit" : "Add"} delivery address`}
    >
      <CustomSuspense>
        <View style={styles.container}>
          <CustomTextInput
            onChangeText={() => {}}
            value={
              `${data.area} ${data.city} ${data.state} ${data.pincode}`.trim() ||
              ""
            }
            type="search"
            variant={2}
            onPress={() => {
              if (!fetchingLocationLoading) {
                router.navigate("/(address)/locationSearchScreen");
              }
            }}
            wrapperStyle={styles.textInputWrapper}
            multiline
          />
          <View style={styles.mapContainer}>
            {/* {fetchingLocationLoading || firstMountLoading ? (
              <View style={styles.loadingOverlay}>
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : null} */}

            <MapWebView
            
              // onTouchStart={() => {
              //   firstMount.current = false;
              // }}
              loadingEnabled
              ref={mapRef}
              zoomControlEnabled
              //provider={PROVIDER_GOOGLE}
              provider={
                Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
              }
              style={styles.map}
              initialRegion={region}
              scrollEnabled={!fetchingLocationLoading}
              showsUserLocation
              showsMyLocationButton
              onRegionChange={(val) => {
                setRegion(val);
              }}
              onRegionChangeComplete={handleRegionChangeComplete}
            >
              <Marker
                coordinate={{
                  latitude: region.latitude,
                  longitude: region.longitude,
                }}
              />
            </MapWebView>
            {fetchingLocationLoading || firstMountLoading ? null : (
              <TouchableOpacity
                onPress={() => {
                  fetchLocationData();
                }}
                style={{
                  zIndex: 200,
                  position: "absolute",
                  bottom: 10,
                  right: 10,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                <MaterialIcons
                  name="my-location"
                  size={24}
                  color={"white"}
                  style={
                    {
                      //right: 15,
                      //position: "absolute",
                      //bottom: 15,
                    }
                  }
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Button
          isLoading={fetchingLocationLoading}
          disabled={fetchingLocationLoading || firstMountLoading}
          wrapperStyle={styles.buttonWrapper}
          title={loc.isWithin ? "Select Location" : "Service is unavailable"}
          onPress={() => {
            if (loc.isWithin) {
              if (fetchingLocationLoading || firstMountLoading) {
              } else {
                // setFirstMountLoading(false);
                // firstMount.current = false;

                dispatch(
                  setCurrentAddressData({
                    ...currentAddressData,
                    form: {
                      ...currentAddressData?.form,
                      ...data,
                      colonyArea: data.area,
                    },
                  })
                );
                router.replace("/(address)/addAddress");
              }
            } else {
              showToast({
                type: "info",
                text2: `Sorry, we only support deliveries within a 5 km radius of Pilkhuwa.`,
              });
            }
          }}
        />
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            We only support deliveries within a 5 km radius of Pilkhuwa.
          </Text>
        </View>
      </CustomSuspense>
    </ScreenSafeWrapper>
  );
};

export default MapSelect;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  textInputWrapper: {
    marginTop: 20,
    marginBottom: 30,
  },
  mapContainer: {
    width: "100%",
    marginBottom: 120,
    borderRadius: 20,
    overflow: "hidden",
  },
  loadingOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 9999999,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  },
  loadingText: {
    fontSize: 30,
    color: "white",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  buttonWrapper: {
    marginBottom: 20,
    paddingTop: 20,
  },
  disclaimerContainer: {
    marginBottom: 10, // Space between the disclaimer and the button
    paddingHorizontal: 20, // Add padding to the sides
    alignItems: "center", // Center-align the text
  },
  disclaimerText: {
    fontSize: 14, // Set a small font size
    // color: "#666", // Light gray color for subtlety
    textAlign: "center", // Center-align text for readability
    fontFamily: "Montserrat_500Medium",
    color: Colors.light.mediumGrey,
  },
});