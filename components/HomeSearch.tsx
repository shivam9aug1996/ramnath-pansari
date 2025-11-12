import { Pressable, StyleSheet, View } from "react-native";
import React, { useEffect, useState, useRef, memo } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import { router } from "expo-router";

import CustomTextInput from "./CustomTextInput";
import { useFetchRecentSearchQuery } from "@/redux/features/recentSearchSlice";
import { Colors } from "@/constants/Colors";
import { useIsFocused } from "@react-navigation/native";

const ANIMATION_DURATION = 250;
const PLACEHOLDER_INTERVAL = 2500;

const HomeSearch = () => {
  const userId = useSelector((state) => state?.auth?.userData?._id);
  const { data } = useFetchRecentSearchQuery({ userId },{skip:!userId});
  const isFocused = useIsFocused();

  const recentQueries = data
    ? [...data]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        ?.map((item) => item?.query)
    : [];

  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const initialTextSet = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  // // Initialize or rotate placeholder text
  // useEffect(() => {
  //   if (!recentQueries.length) {
  //     setDisplayedText("Search...");
  //     return;
  //   }

  //   if (!initialTextSet.current) {
  //     setDisplayedText(recentQueries[0]);
  //     initialTextSet.current = true;
  //   }

  //   const interval = setInterval(() => {
  //     setCurrentPlaceholderIndex((prev) => (prev + 1) % recentQueries.length);
  //   }, PLACEHOLDER_INTERVAL);

  //   return () => clearInterval(interval);
  // }, [recentQueries]);

  useEffect(() => {
    if (!isFocused) {
      // Clear interval when not focused
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (!recentQueries.length) {
      setDisplayedText("Search...");
      return;
    }

    if (!initialTextSet.current) {
      setDisplayedText(recentQueries[0]);
      initialTextSet.current = true;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval only when focused
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholderIndex((prev) => (prev + 1) % recentQueries.length);
    }, PLACEHOLDER_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [recentQueries, isFocused]);

  // Animate placeholder change
  useEffect(() => {
    if (!recentQueries.length || !isFocused) return;

    const nextText = recentQueries[currentPlaceholderIndex];
    if (displayedText === nextText) return;

    translateY.value = withTiming(-20, {
      duration: ANIMATION_DURATION,
      easing: Easing.ease,
    });
    opacity.value = withTiming(
      0,
      { duration: ANIMATION_DURATION, easing: Easing.ease },
      (finished) => {
        if (finished) {
          translateY.value = 20;
          opacity.value = 0;

          runOnJS(setDisplayedText)(nextText);

          translateY.value = withTiming(0, {
            duration: ANIMATION_DURATION,
            easing: Easing.ease,
          });
          opacity.value = withTiming(1, {
            duration: ANIMATION_DURATION,
            easing: Easing.ease,
          });
        }
      }
    );
  }, [currentPlaceholderIndex, recentQueries,isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    router.push("/(search)/search");
  };

  return (
    <>
      <CustomTextInput
        onChangeText={() => {}}
        type="search"
        variant={2}
        wrapperStyle={styles.textInputWrapper}
        textInputStyle={styles.textInputStyle}
        onPress={handlePress}
      />
      <Pressable
        onPress={handlePress}
        style={{ position: "absolute", left: 75, top: 42, width: "75%" }}
      >
        <Animated.Text
          numberOfLines={1}
          style={[styles.placeholderText, animatedStyle]}
        >
          {displayedText}
        </Animated.Text>
      </Pressable>
    </>
  );
};

export default memo(HomeSearch);

const styles = StyleSheet.create({
  textInputWrapper: {
    marginTop: 20,
    marginBottom: 30,
    backgroundColor: Colors.light.white,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.light.lightGrey,
  },
  textInputStyle: {
    fontSize: 16,
    color: Colors.light.darkGreen,
    top: 1,
    fontFamily: "Montserrat_500Medium",
  },
  placeholderText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    color: "rgba(0,0,0,0.5)",
  },
});
