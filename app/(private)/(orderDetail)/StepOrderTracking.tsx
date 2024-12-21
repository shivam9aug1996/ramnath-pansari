import { Colors } from "@/constants/Colors";
import { AntDesign, FontAwesome5 } from "@expo/vector-icons";
import React, { memo } from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { OrderStatus } from "../(order)/mock";
import { convertDate, getOrderStatusTitle1 } from "../(order)/utils";
import StepItem from "./StepItem";

const StepOrderTracking = ({ trackingData }) => {
  const renderItem = ({ item, index }) => {
    const trackingDataLength = trackingData?.length || 0;
    return (
      <StepItem
        timestamp={item?.timestamp}
        status1={item?.status}
        index={index}
        trackingDataLength={trackingDataLength}
      />
    );
  };

  return (
    <View style={styles.container}>
      {trackingData?.map((item, index) => {
        const trackingDataLength = trackingData?.length || 0;

        return (
          <StepItem
            key={item?.timestamp + index}
            timestamp={item?.timestamp}
            status1={item?.status}
            index={index}
            trackingDataLength={trackingDataLength}
          />
        );
      })}
      {/* <ScrollView horizontal style={{ flex: 1 }}>
        <FlatList
          nestedScrollEnabled
          data={trackingData}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ marginTop: 20 }}
        />
      </ScrollView> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: "#fff",
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 0,
  },
  stepIndicatorContainer: {
    width: 20,
    alignItems: "center",
    top: 3,
    left: 20,
  },
  completedStep: {
    width: 5,
    height: 5,
    borderRadius: 6,
    backgroundColor: "#4CAF50", // Green for completed
  },
  currentStep: {
    width: 5,
    height: 5,
    borderRadius: 6,
    // backgroundColor: "#FF9800", // Orange for current
  },
  stepLine: {
    width: 1,
    height: 45,
    backgroundColor: "#4CAF50",
    position: "absolute",
    top: 12,
    left: 9, // Center the line with the dot
    opacity: 0.5,
  },
  stepContent: {
    marginLeft: 40,
    // left: 30,
  },
  stepStatus: {
    fontSize: 12,
    color: Colors.light.darkGrey,
    fontFamily: "Raleway_700Bold",
    paddingBottom: 3,
    textTransform: "capitalize",
  },
  stepDate: {
    fontSize: 10,
    color: Colors.light.mediumLightGrey,
    fontFamily: "Montserrat_500Medium",
    letterSpacing: 1,
  },
});

export default memo(StepOrderTracking);
