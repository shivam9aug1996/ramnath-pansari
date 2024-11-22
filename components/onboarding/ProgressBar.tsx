import React, { memo, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { shiftedArrays } from "../../app/(public)/(onboarding)/utils";
import { ProgressBarProps } from "@/types/global";

const ProgressBar = ({ activeIndex }: ProgressBarProps) => {
  const array = useMemo(() => shiftedArrays[activeIndex], [activeIndex]);
  return (
    <View style={styles.container}>
      {array?.map((itemWidth, index) => (
        <View
          key={index}
          style={[
            styles.progressBar,
            { width: itemWidth, opacity: activeIndex === index ? 1 : 0.5 },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 5.3,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.light.lightGreen,
    borderRadius: 8,
  },
});

export default memo(ProgressBar);
