import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import PagerView from "react-native-pager-view";
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
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
  const pageRef = useRef(0);
  const userPausedUntilRef = useRef(0);

  const slides = messages.length > 0 ? messages : [""];
  const count = slides.length;
  const looping = count > 1;

  const loopedSlides = useMemo(() => {
    if (!looping) return slides;
    return [slides[count - 1], ...slides, slides[0]];
  }, [slides, count, looping]);

  const logicalFromPager = useCallback(
    (pagerIndex: number) => {
      if (!looping) return 0;
      if (pagerIndex === 0) return count - 1;
      if (pagerIndex === count + 1) return 0;
      return pagerIndex - 1;
    },
    [looping, count],
  );

  const pagerFromLogical = useCallback(
    (logicalIndex: number) => (looping ? logicalIndex + 1 : 0),
    [looping],
  );

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    if (page >= count) {
      setPage(0);
      pageRef.current = 0;
      pagerRef.current?.setPageWithoutAnimation(pagerFromLogical(0));
    }
  }, [count, page, pagerFromLogical]);

  useEffect(() => {
    if (!autoPlay || !looping) return;

    const id = setInterval(() => {
      if (Date.now() < userPausedUntilRef.current) return;

      const current = pageRef.current;
      // Animate through clone on wrap so swipe-next from last feels continuous.
      if (current === count - 1) {
        pagerRef.current?.setPage(count + 1);
      } else {
        pagerRef.current?.setPage(pagerFromLogical(current + 1));
      }
    }, 5000);

    return () => clearInterval(id);
  }, [autoPlay, looping, count, pagerFromLogical]);

  const onPageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const position = e.nativeEvent.position;

      if (looping && position === 0) {
        pagerRef.current?.setPageWithoutAnimation(count);
        setPage(count - 1);
        pageRef.current = count - 1;
        return;
      }

      if (looping && position === count + 1) {
        pagerRef.current?.setPageWithoutAnimation(1);
        setPage(0);
        pageRef.current = 0;
        return;
      }

      const logical = logicalFromPager(position);
      setPage(logical);
      pageRef.current = logical;
    },
    [looping, count, logicalFromPager],
  );

  const onScrollStateChanged = useCallback(
    (e: { nativeEvent: { pageScrollState: string } }) => {
      if (e.nativeEvent.pageScrollState === "dragging") {
        userPausedUntilRef.current = Date.now() + 8000;
      }
    },
    [],
  );

  const goTo = useCallback(
    (logicalIndex: number) => {
      userPausedUntilRef.current = Date.now() + 8000;
      pagerRef.current?.setPage(pagerFromLogical(logicalIndex));
    },
    [pagerFromLogical],
  );

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={looping ? 1 : 0}
        onPageSelected={onPageSelected}
        onPageScrollStateChanged={onScrollStateChanged}
      >
        {loopedSlides.map((message, index) => {
          const logical = looping
            ? index === 0
              ? count - 1
              : index === count + 1
                ? 0
                : index - 1
            : index;

          return (
            <View key={`slide-${index}`} style={styles.page}>
              <View
                style={[
                  styles.card,
                  { backgroundColor: colorForLogicalIndex(logical) },
                ]}
              >
                <Text style={styles.greetingText}>
                  {truncateText(message, 200)}
                </Text>
              </View>
            </View>
          );
        })}
      </PagerView>

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
    flex: 1,
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
