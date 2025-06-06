import React from "react";
import { View, Text, StyleSheet, FlatList, Platform } from "react-native";

const TrackingTimeline = ({ trackingData }) => {
  const renderItem = ({ item, index }) => (
    <View style={[styles.itemContainer]}>
      <View style={styles.dotContainer}>
        <View style={styles.dot} />
        {index !== trackingData.length - 1 && <View style={styles.line} />}
      </View>
      <View
        style={[
          styles.infoContainer,
          {
            // padding: 15,
            borderRadius: 23,
            // width: "70%",
            //padding: 15,
          },
        ]}
      >
        <Text style={styles.status}>{item.status}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
    </View>
  );

  return (
    <FlatList
    bounces={Platform.OS === "android" ? false : true}
      data={trackingData}
      renderItem={renderItem}
      keyExtractor={(item, index) => index.toString()}
      contentContainerStyle={{ marginTop: 20, paddingVertical: 20 }}
    />
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    //marginVertical: 8,
  },
  dotContainer: {
    alignItems: "center",
    width: 40,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "blue",
  },
  line: {
    width: 2,
    height: 50, // Adjust this height as needed to connect the dots without breaking
    backgroundColor: "blue",
  },
  infoContainer: {
    flex: 1,
    paddingLeft: 10,
    position: "absolute",
    left: 40,
    top: -3,
    //paddingBottom: 2,
  },
  status: {
    fontSize: 16,
    fontWeight: "bold",
  },
  date: {
    fontSize: 14,
    color: "gray",
  },
});

export default TrackingTimeline;
