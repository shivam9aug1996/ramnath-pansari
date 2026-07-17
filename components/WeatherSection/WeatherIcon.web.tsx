import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from "react-native";
import { truncateText } from "@/utils/utils";

export const arrayColor = ["#F9FAFB", "#FAF9F6", "#FBFAFF"];

type WeatherIconProps = {
  messages: string[];
  autoPlay?: boolean;
};

function colorForLogicalIndex(index: number) {
  return arrayColor[index % arrayColor.length];
}

const WeatherIcon: React.FC<WeatherIconProps> = ({
  messages,
  autoPlay = true,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [width, setWidth] = useState(0);
  const pageRef = useRef(0);
  const userPausedUntilRef = useRef(0);

  const slides = messages.length > 0 ? messages : [""];
  const count = slides.length;
  const looping = count > 1;

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    if (page >= count) {
      setPage(0);
      pageRef.current = 0;
      if (width > 0) {
        scrollRef.current?.scrollTo({ x: 0, animated: false });
      }
    }
  }, [count, page, width]);

  const scrollToPage = useCallback(
    (index: number, animated = true) => {
      if (width <= 0) return;
      scrollRef.current?.scrollTo({ x: index * width, animated });
    },
    [width],
  );

  useEffect(() => {
    if (!autoPlay || !looping || width <= 0) return;

    const id = setInterval(() => {
      if (Date.now() < userPausedUntilRef.current) return;

      const current = pageRef.current;
      const next = (current + 1) % count;
      scrollToPage(next, true);
      setPage(next);
      pageRef.current = next;
    }, 5000);

    return () => clearInterval(id);
  }, [autoPlay, looping, count, width, scrollToPage]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const nextWidth = e.nativeEvent.layout.width;
    setWidth((prev) => (prev === nextWidth ? prev : nextWidth));
  }, []);

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (width <= 0) return;
      const nextPage = Math.round(e.nativeEvent.contentOffset.x / width);
      const clamped = Math.max(0, Math.min(nextPage, count - 1));
      setPage(clamped);
      pageRef.current = clamped;
    },
    [width, count],
  );

  const onScrollBeginDrag = useCallback(() => {
    userPausedUntilRef.current = Date.now() + 8000;
  }, []);

  const goTo = useCallback(
    (logicalIndex: number) => {
      userPausedUntilRef.current = Date.now() + 8000;
      scrollToPage(logicalIndex, true);
      setPage(logicalIndex);
      pageRef.current = logicalIndex;
    },
    [scrollToPage],
  );

  return (
    <View style={styles.container}>
      <View style={styles.pager} onLayout={onLayout}>
        {width > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={onScrollBeginDrag}
            onMomentumScrollEnd={onScrollEnd}
            scrollEventThrottle={16}
          >
            {slides.map((message, index) => (
              <View key={`slide-${index}`} style={[styles.page, { width }]}>
                <View
                  style={[
                    styles.card,
                    { backgroundColor: colorForLogicalIndex(index) },
                  ]}
                >
                  <Text style={styles.greetingText}>
                    {truncateText(message, 200)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>

      {looping ? (
        <View style={styles.dots}>
          {slides.map((_, index) => (
            <Pressable
              key={`dot-${index}`}
              onPress={() => goTo(index)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Go to message ${index + 1}`}
            >
              <View
                style={[styles.dot, index === page && styles.dotActive]}
              />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    minHeight: 110,
    justifyContent: "center",
  },
  pager: {
    height: 88,
    width: "100%",
  },
  page: {
    justifyContent: "center",
  },
  card: {
    marginBottom: 4,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    minHeight: 76,
    justifyContent: "center",
  },
  greetingText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
    fontFamily: "Raleway_500Medium",
    textAlign: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#cfcfcf",
  },
  dotActive: {
    width: 14,
    backgroundColor: "#666",
  },
});

export default memo(WeatherIcon);
