import { Dimensions, Image, StyleSheet, TouchableOpacity } from "react-native";
import React, { memo } from "react";
import { ThemedView } from "../ThemedView";
import ProgressBar from "./ProgressBar";
import { ThemedText } from "../ThemedText";
import { Colors } from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "@/hooks/useColorScheme";
import { OnboardingItemProps } from "@/types/global";

const width = Dimensions.get("screen").width;
const OnboardingItem = ({
  handlePress,
  item,
  activeSlide,
}: OnboardingItemProps) => {
  const colorScheme = useColorScheme();
  return (
    <ThemedView
      style={[styles.container, { backgroundColor: item.backgroundColor }]}
    >
      <ThemedView style={styles.imageContainer}>
        <Image source={item.image} style={styles.image} />
      </ThemedView>
      <ThemedView style={styles.ellipseContainer}>
        <ThemedView style={styles.ellipse} />
      </ThemedView>
      <ThemedView style={styles.textContainer}>
        <ProgressBar activeIndex={activeSlide} />
        <ThemedView style={styles.content}>
          <ThemedText style={styles.title} type="title">
            {item.title}
          </ThemedText>
          <ThemedText style={styles.text}>{item.text}</ThemedText>
        </ThemedView>
        <ThemedView style={{ flex: 1, justifyContent: "center" }}>
          <ThemedView style={styles.outerButtonBorder}>
            <TouchableOpacity onPress={handlePress}>
              <LinearGradient
                colors={[
                  Colors.light.gradientGreen_2,
                  Colors.light.gradientGreen_1,
                ]}
                style={[styles.button]}
              >
                <Image
                  tintColor={
                    colorScheme == "dark"
                      ? Colors.dark.darkGreen_3
                      : Colors.light.white
                  }
                  source={require("../../assets/images/bi_arrow-right.png")}
                  style={{ width: 30, height: 30 }}
                />
              </LinearGradient>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
};

export default memo(OnboardingItem);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    flex: 1.2,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "stretch",
  },
  ellipseContainer: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  ellipse: {
    width: width / 2,
    height: 200,
    borderRadius: 100,
    transform: [{ scaleX: 4 }],
  },
  textContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    textAlign: "center",
  },
  text: {
    textAlign: "center",
    marginTop: 19,
    lineHeight: 19,
    color: Colors.light.mediumLightGrey,
  },
  content: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 52,
    justifyContent: "flex-start",
    marginTop: 35,
  },
  button: {
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 61,
    paddingVertical: 25,
  },
  outerButtonBorder: {
    backgroundColor: "transparent",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(43, 175, 111, 0.3)",
  },
});
