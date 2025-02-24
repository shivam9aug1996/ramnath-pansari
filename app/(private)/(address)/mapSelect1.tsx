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
import MapView, {
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
  const params = useLocalSearchParams();
  const {
    loading: fetchingLocationLoading,
    data: fetchingLocationData,
    fetchLocationData,
  } = useFetchLocation();
  //const searchData = params;

  const currentAddressData = useSelector(
    (state: RootState) => state?.address?.currentAddressData
  );
  const searchData = currentAddressData?.form;
  //console.log("searchData1", searchData1);
  const updateMapRegion = useCallback(
    (latitude: number, longitude: number, animate = true) => {
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      if (animate) {
        mapRef.current?.animateToRegion(newRegion, 1000);
      }
      setTimeout(() => {
        firstMount.current = false;
      }, 1000);
    },
    []
  );
  console.log("i765redfghjk", fetchingLocationData);
  // Fetch location data or update map when searchData changes
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

  // Update map when fetching new location data
  useEffect(() => {
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
      setTimeout(() => {
        firstMount.current = false;
      }, 500);
      //updateMapRegion(parseFloat(latitude), parseFloat(longitude));
    }
  }, [fetchingLocationData?.latitude]);

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
  console.log("8765redfghjk", currentAddressData);

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
      console.log("hiiuy456789");
      debouncedFetchLocation(region.latitude, region.longitude);
      firstMount.current = true;
    }
  }, [region]);

  return (
    <ScreenSafeWrapper useKeyboardAvoidingView>
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
          {fetchingLocationLoading && firstMount.current && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          )}

          <MapView
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
            onRegionChange={setRegion}
            onRegionChangeComplete={handleRegionChangeComplete}
          >
            <Marker
              coordinate={{
                latitude: region.latitude,
                longitude: region.longitude,
              }}
            />
          </MapView>
        </View>
      </View>
      {!fetchingLocationLoading && (
        <TouchableOpacity
          onPress={() => {
            fetchLocationData();
          }}
          style={{
            zIndex: 200,
            position: "absolute",
            bottom: 130,
            right: 10,
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
      <Button
        isLoading={fetchingLocationLoading}
        wrapperStyle={styles.buttonWrapper}
        title="Select Location"
        onPress={() => {
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
          router.navigate("/(address)/addAddress");
        }}
      />
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
    pointerEvents: "none",
    zIndex: 9999,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
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
});
