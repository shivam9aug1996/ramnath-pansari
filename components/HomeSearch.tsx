import { Pressable, StyleSheet, View } from "react-native";
import React, { useEffect, useMemo, useState, useRef, memo } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import { router, useIsFocused } from "expo-router";
import { RootState } from "@/types/global";
import { Colors } from "@/constants/Colors";
import { useCachedRecentSearch } from "@/hooks/useCachedRecentSearch";
import CustomTextInput from "./CustomTextInput";
import { setCurrentSearchQuery } from "@/redux/features/searchSlice";
import { useDispatch } from "react-redux";
const ANIMATION_DURATION = 250;
const PLACEHOLDER_INTERVAL = 2500;

const HomeSearch = ({ compact = false }: { compact?: boolean }) => {
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const data = useCachedRecentSearch(userId, "HomeSearch");

  const isFocused = useIsFocused();
  const dispatch = useDispatch();

  const dataKey = data.length
    ? data
        .map((item) => `${item._id}:${item.timestamp}:${item.query}`)
        .join("|")
    : "";

  const recentQueries = useMemo(() => {
    if (!dataKey) return [];
    return [...data]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .map((item) => item?.query)
      .filter(Boolean);
  }, [dataKey, data]);
  const recentQueriesKey = recentQueries.join("|");

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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (!recentQueries.length) {
      initialTextSet.current = false;
      setDisplayedText((prev) => (prev === "Search..." ? prev : "Search..."));
      return;
    }

    if (!initialTextSet.current) {
      initialTextSet.current = true;
      setDisplayedText(recentQueries[0]);
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCurrentPlaceholderIndex((prev) => (prev + 1) % recentQueries.length);
    }, PLACEHOLDER_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [recentQueriesKey, isFocused, recentQueries]);

  useEffect(() => {
    initialTextSet.current = false;
    setCurrentPlaceholderIndex(0);
  }, [recentQueriesKey]);

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
  }, [currentPlaceholderIndex, recentQueriesKey, isFocused, displayedText, recentQueries]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    dispatch(setCurrentSearchQuery(''));
    router.push("/(search)/search");
  };

  return (
    <>
      <CustomTextInput
        onChangeText={() => {}}
        type="search"
        variant={2}
        wrapperStyle={[
          styles.textInputWrapper,
          compact && styles.textInputWrapperCompact,
          
        ]}
        
        textInputStyle={styles.textInputStyle}
        onPress={handlePress}
      />
      <Pressable
        onPress={handlePress}
        style={[
          { position: "absolute", left: 75, top: compact ? 22 : 42, width: "75%" },
        ]}
      >
        <Animated.Text
          numberOfLines={1}
          style={[styles.placeholderText, animatedStyle, compact && styles.placeholderTextCompact]}
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
  textInputWrapperCompact: {
    marginTop: 0,
    marginBottom: 0,
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
  placeholderTextCompact: {
    top: 12,
  },
});
