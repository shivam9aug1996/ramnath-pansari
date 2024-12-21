import { StyleSheet, Text, View, Image } from "react-native";
import React, { memo } from "react";
import { convertDate, getOrderStatusTitle1 } from "../(order)/utils";
import { Colors } from "@/constants/Colors";

const StepItem = ({ timestamp, status1, index, trackingDataLength = 0 }) => {
  const status = status1?.toLowerCase();
  const backgroundColor =
    status === "out_for_delivery"
      ? "#FFF7CD"
      : status === "confirmed"
      ? "#E0F7FA"
      : status === "canceled"
      ? "#F8ECEC"
      : "#EBF4F1";
  const textColor =
    status === "out_for_delivery"
      ? "#b5a35d" // Yellow for out for delivery
      : status === "confirmed"
      ? "#00B0FF" // Blue for confirmed
      : status === "canceled"
      ? "#FF6B6B" // Red for canceled
      : "#4CAF50"; // Green for delivered
  return (
    <View
      key={timestamp || index}
      style={[
        styles.stepContainer,
        {
          backgroundColor: index == 0 ? backgroundColor : "transparent",
          padding: 10,
          borderRadius: 23,
          marginBottom: index == 0 ? 9 : 0,
          paddingVertical: index == 0 ? 20 : 10,
        },
      ]}
    >
      {index == 0 && (
        <View
          style={{
            position: "absolute",
            //backgroundColor: "red",
            // height: "100%",
            top: 0,
            left: 27,
            backgroundColor: backgroundColor,
            zIndex: 2,
            paddingVertical: 22,
            // paddingHorizontal: 5,
          }}
        >
          <Image
            source={
              status !== "canceled"
                ? require("../../../assets/images/circle-check.png")
                : require("../../../assets/images/circle-x.png")
            }
            style={{ width: 24, height: 24 }}
            tintColor={textColor}
          />
        </View>
      )}
      <View style={styles.stepIndicatorContainer}>
        {/* Circle Indicator */}
        <View
          style={
            index === 0
              ? styles.currentStep
              : [
                  styles.completedStep,
                  {
                    backgroundColor: Colors.light.lightGrey,
                    width: 13,
                    height: 13,
                  },
                  {
                    justifyContent: "center",
                    alignItems: "center",
                  },
                ]
          }
        >
          <View
            style={
              index === 0
                ? styles.currentStep
                : [
                    styles.completedStep,
                    {
                      backgroundColor: Colors.light.darkGrey,
                    },
                  ]
            }
          />
        </View>
        {/* Line connecting dots */}
        {index < trackingDataLength - 1 && (
          <View
            style={[
              styles.stepLine,
              {
                backgroundColor: Colors.light.darkGrey,
                height: index == 0 ? 60 : 45,
                opacity: 0.2,
              },
            ]}
          />
        )}
      </View>
      <View style={styles.stepContent}>
        <Text
          style={
            index == 0
              ? [
                  styles.stepStatus,
                  {
                    color: textColor,
                  },
                ]
              : styles.stepStatus
          }
        >
          {getOrderStatusTitle1(status1)}
        </Text>
        <Text
          style={
            index == 0
              ? [
                  styles.stepDate,
                  {
                    color: textColor,
                  },
                ]
              : styles.stepDate
          }
        >
          {convertDate(timestamp)}
        </Text>
      </View>
    </View>
  );
};

export default memo(StepItem);

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
