import { StyleSheet, Text, View, ViewStyle } from "react-native";
import React, { memo } from "react";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";

const NotFound = ({
  title,
  subtitle,
  style,
}: {
  title: string;
  subtitle: string;
  style?: ViewStyle;
}) => {
  return (
    <View
      style={[
        {
          flex: 0.35,
          justifyContent: "center",
          alignItems: "center",
          marginTop: 30,
        },
        style,
      ]}
    >
      <View
        style={{
          borderRadius: 23,
          height: 70,
          width: 67,
          backgroundColor: "#EBF4F1",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Image
          source={require("../../../assets/images/cry.png")}
          style={{
            width: 25,
            height: 25,
          }}
        />
      </View>
      <Text
        style={{
          fontFamily: "Raleway_800ExtraBold",
          fontSize: 18,
          color: Colors.light.darkGreen,
          marginTop: 15,
          marginBottom: 5,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: "Raleway_500Medium",
          fontSize: 12,
          color: Colors.light.mediumLightGrey,
          textAlign: "center",
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
};

export default memo(NotFound);

const styles = StyleSheet.create({});
