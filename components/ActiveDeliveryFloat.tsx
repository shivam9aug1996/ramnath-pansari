import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useFetchActiveDeliveriesQuery } from "@/redux/features/orderSlice";
import { OrderStatus } from "@/constants/Order";
import { RootState } from "@/types/global";
import {
  ACTIVE_FLOAT_STATUS_QUERY,
  ActiveFloatOrder,
  getFloatCopy,
  shouldOpenSheet,
} from "@/utils/activeOrderFloat";
import { useOrderStatusListener } from "@/hooks/useOrderStatusListener";
import useAppState from "@/hooks/useAppState";
import { useDeliveryFloatInsetSetter } from "@/contexts/DeliveryFloatContext";
import ActiveDeliverySheet from "@/components/ActiveDeliverySheet";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const TAB_BAR_HEIGHT = 80;
const FLOAT_GAP = 12;
const HORIZONTAL_MARGIN = 12;
const TAB_ROUTES = ["/home", "/account", "/cart"];
const HOME_TAB_ROUTE = "/home";
const SPRING_CONFIG = { damping: 22, stiffness: 220 };
const PILL_HEIGHT = 52;
const COMPACT_SIZE = 56;
const FULL_PILL_WIDTH = SCREEN_WIDTH - HORIZONTAL_MARGIN * 2;

function isTabRoute(pathname: string) {
  return TAB_ROUTES.some(
    (route) => pathname === route || pathname.endsWith(route),
  );
}

function isHomeTab(pathname: string) {
  return (
    pathname === HOME_TAB_ROUTE || pathname.endsWith(HOME_TAB_ROUTE)
  );
}

const ActiveDeliveryFloat = () => {
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const appState = useAppState();
  const setBottomInset = useDeliveryFloatInsetSetter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [hasCustomPosition, setHasCustomPosition] = useState(false);
  const prevIsCompactRef = useRef<boolean | null>(null);

  const isCompact = !isHomeTab(pathname);
  const pillHeight = isCompact ? COMPACT_SIZE : PILL_HEIGHT;
  const pillWidth = isCompact ? COMPACT_SIZE : FULL_PILL_WIDTH;

  const posX = useSharedValue(HORIZONTAL_MARGIN);
  const posY = useSharedValue(0);
  const dragStartX = useSharedValue(HORIZONTAL_MARGIN);
  const dragStartY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const minYShared = useSharedValue(0);
  const maxYShared = useSharedValue(0);
  const pillWidthShared = useSharedValue(pillWidth);

  useOrderStatusListener();

  const { data, refetch } = useFetchActiveDeliveriesQuery(
    {
      userId,
      status: ACTIVE_FLOAT_STATUS_QUERY,
      limit: 20,
      page: 1,
    },
    { skip: !userId },
  );

  useEffect(() => {
    if (appState === "active" && userId) {
      refetch();
    }
  }, [appState, refetch, userId]);

  const activeOrders = useMemo(
    () => (data?.orders ?? []) as ActiveFloatOrder[],
    [data?.orders],
  );

  const bottomReserved = useMemo(() => {
    if (isTabRoute(pathname)) {
      return TAB_BAR_HEIGHT + insets.bottom + FLOAT_GAP;
    }
    return insets.bottom + FLOAT_GAP;
  }, [insets.bottom, pathname]);

  const defaultY = SCREEN_HEIGHT - bottomReserved - pillHeight;
  const minY = insets.top + FLOAT_GAP;
  const maxY = defaultY;
  const defaultX = isCompact
    ? SCREEN_WIDTH - COMPACT_SIZE - HORIZONTAL_MARGIN
    : HORIZONTAL_MARGIN;

  useEffect(() => {
    minYShared.value = minY;
    maxYShared.value = maxY;
    pillWidthShared.value = pillWidth;
  }, [maxY, minY, maxYShared, minYShared, pillWidth, pillWidthShared]);

  useEffect(() => {
    const layoutModeChanged =
      prevIsCompactRef.current !== null &&
      prevIsCompactRef.current !== isCompact;
    prevIsCompactRef.current = isCompact;

    if (layoutModeChanged) {
      setHasCustomPosition(false);
    }

    if (hasCustomPosition && !layoutModeChanged) return;

    posX.value = withSpring(defaultX, SPRING_CONFIG);
    posY.value = withSpring(defaultY, SPRING_CONFIG);
    dragStartX.value = defaultX;
    dragStartY.value = defaultY;
  }, [
    defaultX,
    defaultY,
    dragStartX,
    dragStartY,
    hasCustomPosition,
    isCompact,
    posX,
    posY,
  ]);

  const isHiddenOnDetail = useMemo(() => {
    if (activeOrders.length !== 1) return false;
    const orderId = String(activeOrders[0]?._id ?? "");
    return orderId.length > 0 && pathname.includes(orderId);
  }, [activeOrders, pathname]);

  const isVisible =
    !!userId && activeOrders.length > 0 && !isHiddenOnDetail && !sheetOpen;

  useEffect(() => {
    if (!setBottomInset) return;

    if (!isVisible) {
      setBottomInset(0);
      return;
    }

    const inset = isHomeTab(pathname)
      ? pillHeight + FLOAT_GAP + TAB_BAR_HEIGHT + insets.bottom
      : 0;

    setBottomInset(inset);
  }, [insets.bottom, isVisible, pathname, pillHeight, setBottomInset]);

  const { label, action: actionLabel } = getFloatCopy(activeOrders);

  const openDelivery = useCallback(() => {
    if (shouldOpenSheet(activeOrders)) {
      setSheetOpen(true);
      return;
    }

    const order = activeOrders[0];
    const prevStatus =
      order.orderStatus?.toLowerCase() ?? OrderStatus.CONFIRMED;
    router.navigate(`/(orderDetail)/${order._id}?prevStatus=${prevStatus}`);
  }, [activeOrders]);

  const markCustomPosition = useCallback(() => {
    setHasCustomPosition(true);
  }, []);

  const composedGesture = useMemo(() => {
    const tapGesture = Gesture.Tap()
      .maxDuration(250)
      .maxDistance(12)
      .onEnd(() => {
        runOnJS(openDelivery)();
      });

    const panGesture = Gesture.Pan()
      .minDistance(14)
      .onStart(() => {
        dragStartX.value = posX.value;
        dragStartY.value = posY.value;
        isDragging.value = true;
      })
      .onUpdate((event) => {
        const maxX =
          SCREEN_WIDTH - pillWidthShared.value - HORIZONTAL_MARGIN;
        const nextX = dragStartX.value + event.translationX;
        const nextY = dragStartY.value + event.translationY;

        posX.value = Math.min(Math.max(HORIZONTAL_MARGIN, nextX), maxX);
        posY.value = Math.min(
          Math.max(minYShared.value, nextY),
          maxYShared.value,
        );
      })
      .onEnd(() => {
        isDragging.value = false;
        runOnJS(markCustomPosition)();

        const width = pillWidthShared.value;
        const centerX = posX.value + width / 2;
        const snapX =
          centerX < SCREEN_WIDTH / 2
            ? HORIZONTAL_MARGIN
            : SCREEN_WIDTH - width - HORIZONTAL_MARGIN;

        posX.value = withSpring(snapX, SPRING_CONFIG);
        posY.value = withSpring(
          Math.min(
            Math.max(minYShared.value, posY.value),
            maxYShared.value,
          ),
          SPRING_CONFIG,
        );
      });

    return Gesture.Exclusive(tapGesture, panGesture);
  }, [dragStartX, dragStartY, isDragging, markCustomPosition, openDelivery]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: posX.value,
    top: posY.value,
    zIndex: 100,
    transform: [{ scale: isDragging.value ? 1.02 : 1 }],
  }));

  if (!userId || activeOrders.length === 0 || isHiddenOnDetail) {
    return null;
  }

  return (
    <>
      {!sheetOpen && (
        <GestureDetector gesture={composedGesture}>
          <Animated.View
            style={[
              isCompact ? styles.compactContainer : styles.container,
              { width: pillWidth, height: isCompact ? COMPACT_SIZE : undefined },
              animatedStyle,
            ]}
          >
            {isCompact ? (
              <View style={styles.compactContent}>
                <MaterialCommunityIcons
                  name="truck-delivery"
                  size={26}
                  color="#F57F17"
                />
                {activeOrders.length > 1 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{activeOrders.length}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.content}>
                <MaterialCommunityIcons
                  name="truck-delivery"
                  size={22}
                  color="#F57F17"
                />
                <Text style={styles.label} numberOfLines={1}>
                  {label}
                </Text>
                <View style={styles.actionPill}>
                  <Text style={styles.actionText}>{actionLabel}</Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={16}
                    color="#fff"
                  />
                </View>
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      )}

      {sheetOpen && (
        <ActiveDeliverySheet
          orders={activeOrders}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF7CD",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#FFE082",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  compactContainer: {
    backgroundColor: "#FFF7CD",
    borderRadius: COMPACT_SIZE / 2,
    borderWidth: 1,
    borderColor: "#FFE082",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  compactContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F57F17",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Montserrat_700Bold",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    flex: 1,
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 14,
    color: "#F57F17",
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F57F17",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 2,
  },
  actionText: {
    color: "#FFFFFF",
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 12,
  },
});

export default ActiveDeliveryFloat;
