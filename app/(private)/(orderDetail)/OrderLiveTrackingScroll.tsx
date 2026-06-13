import React, { type ReactNode } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";
import DriverTrackingWebView from "@/components/DriverTrackingWebView";
import { Colors } from "@/constants/Colors";

export const LIVE_MAP_HEIGHT = 324;
const SHEET_OVERLAP = 28;

type Props = {
  orderId: string;
  children: ReactNode;
};

const OrderLiveTrackingScroll = ({ orderId, children }: Props) => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);

  const mapParallaxStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollOffset.value,
          [0, LIVE_MAP_HEIGHT],
          [0, LIVE_MAP_HEIGHT * 0.45],
        ),
      },
    ],
  }));

  return (
    <Animated.ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      bounces={Platform.OS === "ios"}
      scrollEventThrottle={16}
      contentContainerStyle={styles.scrollContent}
    >
      <Animated.View
        style={[styles.mapHeader, mapParallaxStyle]}
      >
        <DriverTrackingWebView
          orderId={orderId}
          height={LIVE_MAP_HEIGHT}
          fullBleed
        />
      </Animated.View>

      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.statusRow}>
          <View style={styles.statusDotWrap}>
            <View style={styles.statusDot} />
          </View>
          <View style={styles.statusCopy}>
            <Text style={styles.statusTitle}>Out for delivery</Text>
            <Text style={styles.statusSubtitle}>
              Live map above · scroll for order details
            </Text>
          </View>
        </View>
        {children}
      </View>
    </Animated.ScrollView>
  );
};

export default OrderLiveTrackingScroll;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  mapHeader: {
    height: LIVE_MAP_HEIGHT,
    marginTop: 10,
    overflow: "hidden",
    backgroundColor: "#EEF2EF",
  },
  sheet: {
    marginTop: -SHEET_OVERLAP,
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#DDE3DF",
    alignSelf: "center",
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#FFF9E6",
    borderWidth: 1,
    borderColor: "#FFE8A3",
  },
  statusDotWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF0BA",
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFCC00",
  },
  statusCopy: {
    flex: 1,
  },
  statusTitle: {
    fontFamily: "Raleway_700Bold",
    fontSize: 15,
    color: Colors.light.darkGrey,
  },
  statusSubtitle: {
    marginTop: 2,
    fontFamily: "Raleway_500Medium",
    fontSize: 12,
    color: Colors.light.mediumGrey,
  },
});
