import { StyleSheet, Text, View } from "react-native";
import React from "react";

const ShowData = () => {
  return (
    <View>
      {location && (
        <View style={styles.locationInfo}>
          <Text>Latitude: {location.latitude}</Text>
          <Text>Longitude: {location.longitude}</Text>
          <Text>Address: {address || "Address not found"}</Text>
        </View>
      )}
    </View>
  );
};

export default ShowData;

const styles = StyleSheet.create({
  locationInfo: {
    // position: "absolute",
    // bottom: 10,
    // left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    borderRadius: 5,
    color: "white",
  },
});
