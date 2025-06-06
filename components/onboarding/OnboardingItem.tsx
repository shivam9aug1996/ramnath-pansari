import { Dimensions, Image, StyleSheet, View } from "react-native";
import React, { lazy, memo, Suspense } from "react";
import { ThemedView } from "../ThemedView";
import { ThemedText } from "../ThemedText";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { OnboardingItemProps } from "@/types/global";
import CustomSuspense from "../CustomSuspense";
const ProgressBar = lazy(() => import("./ProgressBar"));
const Button = lazy(() => import("./Button"));
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
        <Suspense fallback={<View></View>}>
          <CustomSuspense fallback={<View></View>}>
            <ProgressBar activeIndex={activeSlide} />
          </CustomSuspense>
        </Suspense>
        <ThemedView style={styles.content}>
          <ThemedText style={styles.title} type="title">
            {item.title}
          </ThemedText>
          <ThemedText style={styles.text}>{item.text}</ThemedText>
        </ThemedView>
        <ThemedView style={{ flex: 0.5 }}>
          <Suspense fallback={<View></View>}>
            <CustomSuspense fallback={<View></View>}>
              <Button handlePress={handlePress} />
            </CustomSuspense>
          </Suspense>
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
    flex: 1,
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
    top: "45%",
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
    marginHorizontal: 30,
    justifyContent: "flex-start",
    marginTop: 35,
  },
});
