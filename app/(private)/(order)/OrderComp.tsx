import { Button, Platform, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
} from "react-native-maps";
import { Dimensions } from "react-native";
import polyline from "@mapbox/polyline";
import usePusher from "./usePusher";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { ThemedView } from "@/components/ThemedView";
import { BlurView } from "expo-blur";
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const OrderComp = () => {
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [remainingRoute, setRemainingRoute] = useState([]);
  const [traveledRoute, setTraveledRoute] = useState([]); // Store the traveled route
  const [previousDriverLocation, setPreviousDriverLocation] = useState(null); // Store the previous driver location
  const translateY = useSharedValue(SCREEN_HEIGHT);

  const [driverLocation, setDriverLocation] = useState({
    latitude: 28.7095485,
    longitude: 77.6517825,
  });
  const { isConnected, error, startSocket, closeSocket, message } = usePusher(
    "a7a14b0a75a3d073c905",
    "ap2"
  );

  const customerHomeLocation = { latitude: 28.7183, longitude: 77.6665 };
  const shopLocation = { latitude: 28.7095485, longitude: 77.6517825 };

  useEffect(() => {
    if (message?.data) {
      console.log("Driver Location Update", message);
      setDriverLocation(message?.data);
    }
  }, [message]);

  const fetchRoute = async (origin, destination, setRouteCallback) => {
    try {
      const response = await fetch(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": "AIzaSyCY7OexW8I25uKjtJwqU1hAQZAZ4d8bnqQ",
            "X-Goog-Fieldmask": "*",
          },
          body: JSON.stringify({
            origin: { location: { latLng: origin } },
            destination: { location: { latLng: destination } },
            travelMode: "DRIVE",
          }),
        }
      );

      const data = await response.json();
      const encodedPolyline = data.routes[0].polyline.encodedPolyline;

      const decodedCoordinates = polyline
        .decode(encodedPolyline)
        .map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng,
        }));

      setRouteCallback(decodedCoordinates);
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  useEffect(() => {
    fetchRoute(shopLocation, customerHomeLocation, setRemainingRoute);
  }, []);

  useEffect(() => {
    if (driverLocation.latitude && driverLocation.longitude) {
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000
        );
      }

      // Fetch the remaining route from the driver's current location to the customer home
      fetchRoute(driverLocation, customerHomeLocation, setRemainingRoute);

      // Update the traveled route
      if (previousDriverLocation) {
        setTraveledRoute((prevTraveledRoute) => [
          ...prevTraveledRoute,
          previousDriverLocation,
        ]);
      }

      setPreviousDriverLocation(driverLocation);
    }
  }, [driverLocation]);

  const handleMapLayout = () => {
    setMapReady(true);
  };
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <View style={styles.container}>
      <View
        style={{
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        <MapView
          zoomControlEnabled
          ref={mapRef}
          provider={
            Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
          }
          style={styles.map}
          initialRegion={{
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          onLayout={handleMapLayout}
        >
          <Marker coordinate={driverLocation} title="Driver Location" />

          <Marker coordinate={customerHomeLocation} title="Customer Home" />

          <Marker
            coordinate={shopLocation}
            title="Shop Location"
            pinColor="green"
          />

          {traveledRoute.length > 0 && (
            <Polyline
              coordinates={traveledRoute}
              strokeColor="#808080"
              strokeWidth={3}
            />
          )}

          {remainingRoute.length > 0 && (
            <Polyline
              coordinates={remainingRoute}
              strokeColor="#0000FF"
              strokeWidth={3}
            />
          )}
        </MapView>
      </View>

      {/* <View
        style={{
          flex: 1,
          position: "absolute",
          zIndex: 1,
          width: "100%",
          height: 100,
          backgroundColor: "red",
        }}
      >
        <Button
          title="Start"
          onPress={() => {
            startSocket("c1", "e1");
          }}
        />
        <Button
          title="Close"
          onPress={() => {
            closeSocket();
          }}
        />
      </View> */}
    </View>
  );
};

export default OrderComp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 20,
  },

  map: {
    height: SCREEN_HEIGHT / 4,
    width: "100%",
  },
});
