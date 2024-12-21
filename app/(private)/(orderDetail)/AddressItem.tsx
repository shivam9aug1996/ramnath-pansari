import { StyleSheet, Text, View } from "react-native";
import React, { memo } from "react";
import { Colors } from "@/constants/Colors";
import ContentLoader, { Rect } from "react-content-loader/native";

const renderText = () => {
  return (
    <ContentLoader
      speed={1}
      width={"100%"}
      height={13}
      backgroundColor="#f3f3f3"
      foregroundColor="#e3e3e3"
    >
      <Rect width="100%" y={0} rx={5} ry={5} height="13" />
    </ContentLoader>
  );
};

const AddressItem = ({ addressData, loading }: any) => {
  // Filter and join address parts
  const formattedAddress = [
    addressData?.buildingName,
    addressData?.colonyArea,
    addressData?.city,
    addressData?.state,
  ]
    .filter((part) => part) // Remove falsy values (undefined, null, empty string)
    .join(", "); // Join remaining values with commas

  return (
    <View>
      <View style={[styles.valueContainer]}>
        {loading ? (
          renderText()
        ) : (
          <Text style={[styles.valueText]}>{formattedAddress}</Text>
        )}
      </View>
    </View>
  );
};

export default memo(AddressItem);

const styles = StyleSheet.create({
  heading: {
    fontFamily: "Raleway_700Bold",
    fontSize: 20,
    color: Colors.light.darkGreen,
    marginTop: 20,
  },
  label: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 12,
    color: Colors.light.darkGrey,
    marginLeft: 9,
  },
  valueContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 13,
    flexDirection: "row",
    backgroundColor: "#F4F4F4",
    marginTop: 20,
  },
  valueText: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 10,
    textTransform: "capitalize",
    color: Colors.light.mediumGrey,
  },
});
