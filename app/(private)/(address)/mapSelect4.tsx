import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Marker,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import { router, useLocalSearchParams } from "expo-router";
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
  const mapRef = useRef(null);
  const [region, setRegion] = useState<Region>(initialRegion);
  const [data, setData] = useState<LocationData>({
    city: "",
    state: "",
    pincode: "",
    area: "",
    latitude: "",
    longitude: "",
  });
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  const {
    loading: locationLoading,
    data: locationData,
    fetchLocationData,
  } = useFetchLocation();

  const currentAddressData = useSelector(
    (state: RootState) => state?.address?.currentAddressData
  );

  const itemId = currentAddressData?.action === "edit" 
    ? currentAddressData?.form?._id 
    : undefined;
  
  const searchData = currentAddressData?.form;

  // Update map region and animate to new location
  const updateMapRegion = useCallback(
    (latitude: number, longitude: number, animate = true) => {
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      };
      setRegion(newRegion);
      if (animate && mapRef.current) {
        mapRef.current?.animateToRegion?.(newRegion, 1000);
      }
    },
    []
  );

  // Initial location setup - either from search data or current location
  useEffect(() => {
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

  // Update UI when location data is fetched
  useEffect(() => {
    if (!locationLoading && locationData?.latitude) {
      const { latitude, longitude, city, state, area, pincode } = locationData;
      setData({ latitude, longitude, city, state, area, pincode });
      
      if (locationData.hasLat === false) {
        updateMapRegion(parseFloat(latitude), parseFloat(longitude));
      }
      
      if (isFirstLoad) {
        setIsFirstLoad(false);
      }
    }
  }, [locationLoading, locationData]);

  // Debounced fetch location when map is moved
  const debouncedFetchLocation = useCallback(
    debounce((latitude: number, longitude: number) => {
      fetchLocationData(latitude, longitude);
    }, 500),
    []
  );

  // Handle region change (map moved by user)
  const handleRegionChangeComplete = useCallback(() => {
    if (isMapReady && !isFirstLoad && !locationLoading) {
      debouncedFetchLocation(region.latitude, region.longitude);
    }
  }, [region, isMapReady, isFirstLoad, locationLoading]);

  // Map is ready to interact with
  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
  }, []);

  // Get current location
  const handleGetCurrentLocation = useCallback(() => {
    fetchLocationData();
  }, []);

  // Check if location is within delivery radius
  const locationStatus = isWithinDeliveryRadius({
    latitude: region.latitude,
    longitude: region.longitude,
  });
  
  // Determine if button should be disabled
  const isButtonDisabled = locationLoading || isFirstLoad;

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
              if (!locationLoading) {
                router.navigate("/(address)/locationSearchScreen");
              }
            }}
            wrapperStyle={styles.textInputWrapper}
            multiline
          />
          <View style={styles.mapContainer}>
            <MapWebView
              loadingEnabled
              ref={mapRef}
              zoomControlEnabled
              provider={
                Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
              }
              style={styles.map}
              initialRegion={region}
              scrollEnabled={!locationLoading}
              showsUserLocation
              showsMyLocationButton
              onRegionChange={setRegion}
              onRegionChangeComplete={handleRegionChangeComplete}
              onMapReady={handleMapReady}
            >
              <Marker
                coordinate={{
                  latitude: region.latitude,
                  longitude: region.longitude,
                }}
              />
            </MapWebView>
            
            {!locationLoading && !isFirstLoad && (
              <TouchableOpacity
                onPress={handleGetCurrentLocation}
                style={styles.locationButton}
              >
                <MaterialIcons
                  name="my-location"
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Button
          isLoading={locationLoading}
          disabled={isButtonDisabled}
          wrapperStyle={styles.buttonWrapper}
          title={locationStatus.isWithin ? "Select Location" : "Service is unavailable"}
          onPress={() => {
            if (locationStatus.isWithin && !isButtonDisabled) {
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
            } else if (!locationStatus.isWithin) {
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
    flex: 1,
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  locationButton: {
    zIndex: 200,
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 10,
  },
  buttonWrapper: {
    marginBottom: 20,
    paddingTop: 20,
  },
  disclaimerContainer: {
    marginBottom: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  disclaimerText: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Montserrat_500Medium",
    color: Colors.light.mediumGrey,
  },
}); 