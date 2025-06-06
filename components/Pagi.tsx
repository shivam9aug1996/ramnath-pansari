import React, { memo } from "react";
import { View } from "react-native";
import PahiItem from "./PahiItem";

const Pagi = ({ currentIndex, data }) => {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
        minHeight: 20,
      }}
    >
      {data.map((item, index) => (
        <PahiItem key={item?.id} index={index} currentIndex={currentIndex} />
      ))}
    </View>
  );
};

export default memo(Pagi);
