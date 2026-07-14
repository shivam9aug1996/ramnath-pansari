import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
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
import {
  useDeliveryFloatInsetSetter,
  useGoToCartMeasuredInset,
  useCartFooterInset,
} from "@/contexts/DeliveryFloatContext";
import {
  getCartFooterFallbackInset,
  getTabBarReservedHeight,
} from "@/utils/bottomChrome";
import ActiveDeliverySheet from "@/components/ActiveDeliverySheet";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const FLOAT_GAP = 12;
const HORIZONTAL_MARGIN = 12;
const TAB_ROUTES = ["/home", "/account", "/cart"];
const HOME_TAB_ROUTE = "/home";
const CART_TAB_ROUTE = "/cart";
const INSET_SNAP_THRESHOLD = 2;
const SPRING_CONFIG = { damping: 22, stiffness: 220 };
const PILL_HEIGHT = 52;
const COMPACT_SIZE = 56;
const FULL_PILL_WIDTH = SCREEN_WIDTH - HORIZONTAL_MARGIN * 2;
const TAB_FLOAT_EXTRA_PADDING = 50;
const CART_FLOAT_EXTRA_PADDING = 40;
const HOME_FLOAT_EXTRA_PADDING = 30;

function hasMeaningfulInsetChange(previous: number, next: number) {
  return Math.abs(previous - next) >= INSET_SNAP_THRESHOLD;
}

function isTabRoute(pathname: string) {
  return TAB_ROUTES.some(
    (route) => pathname === route || pathname.endsWith(route),
  );
}

function isHomeTab(pathname: string) {
  return pathname === HOME_TAB_ROUTE || pathname.endsWith(HOME_TAB_ROUTE);
}

function isCartTab(pathname: string) {
  return pathname === CART_TAB_ROUTE || pathname.endsWith(CART_TAB_ROUTE);
}

function isCartCheckoutRoute(pathname: string) {
  return pathname.includes("/cartScreen") || isCartTab(pathname);
}

function getBottomReserved(
  pathname: string,
  cartFooterInset: number,
  goToCartInset: number,
  safeAreaBottom: number,
): number {
  const tabBarHeight = getTabBarReservedHeight(safeAreaBottom);
  const isCartScreen = pathname.includes("/cartScreen");
  const checkoutFooterInset =
    isCartCheckoutRoute(pathname) && cartFooterInset > 0 ? cartFooterInset : 0;

  if (checkoutFooterInset > 0) {
    let reserved = checkoutFooterInset + FLOAT_GAP + CART_FLOAT_EXTRA_PADDING;
    if (isCartScreen) {
      reserved = reserved - CART_FLOAT_EXTRA_PADDING;
    }
    if (isCartTab(pathname)) {
      const tabBar = getTabBarReservedHeight(safeAreaBottom);
      const floor = tabBar + getCartFooterFallbackInset(0) + FLOAT_GAP + 20;
      reserved = Math.max(reserved, floor);
    }
    return reserved;
  }
  if (goToCartInset > 0 && !isTabRoute(pathname)) {
    return goToCartInset + FLOAT_GAP;
  }
  if (isTabRoute(pathname)) {
    let reserved = tabBarHeight + FLOAT_GAP + TAB_FLOAT_EXTRA_PADDING;
    if (isHomeTab(pathname)) {
      reserved = tabBarHeight + FLOAT_GAP + HOME_FLOAT_EXTRA_PADDING;
    }
    if (isCartTab(pathname)) {
      if (cartFooterInset <= 0) {
        reserved += safeAreaBottom + FLOAT_GAP - CART_FLOAT_EXTRA_PADDING;
      }
      return reserved;
    }
    return reserved;
  }
  return safeAreaBottom + FLOAT_GAP;
}

export type ActiveDeliveryFloatHomeVariant = "full" | "compact";

type ActiveDeliveryFloatProps = {
  /** Home tab only — other screens stay compact. Default: full pill. */
  homeVariant?: ActiveDeliveryFloatHomeVariant;
};

type ActiveDeliveryFloatPillProps = {
  activeOrders: ActiveFloatOrder[];
  homeVariant: ActiveDeliveryFloatHomeVariant;
  onOpenSheet: () => void;
};

const ActiveDeliveryFloatPill = memo(function ActiveDeliveryFloatPill({
  activeOrders,
  homeVariant,
  onOpenSheet,
}: ActiveDeliveryFloatPillProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const setBottomInset = useDeliveryFloatInsetSetter();
  const goToCartInset = useGoToCartMeasuredInset();
  const cartFooterInset = useCartFooterInset();
  const [hasCustomPosition, setHasCustomPosition] = useState(false);
  const prevIsCompactRef = useRef<boolean | null>(null);
  const prevPathnameRef = useRef(pathname);
  const prevGoToCartInsetRef = useRef(goToCartInset);
  const prevCartFooterInsetRef = useRef(cartFooterInset);

  const isCompact = isHomeTab(pathname) ? homeVariant === "compact" : true;
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

  const bottomReserved = useMemo(
    () =>
      getBottomReserved(
        pathname,
        cartFooterInset,
        goToCartInset,
        insets.bottom,
      ),
    [cartFooterInset, goToCartInset, insets.bottom, pathname],
  );

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
    const routeChanged = prevPathnameRef.current !== pathname;
    prevPathnameRef.current = pathname;

    const goToCartInsetChanged = hasMeaningfulInsetChange(
      prevGoToCartInsetRef.current,
      goToCartInset,
    );
    prevGoToCartInsetRef.current = goToCartInset;

    const cartFooterInsetChanged = hasMeaningfulInsetChange(
      prevCartFooterInsetRef.current,
      cartFooterInset,
    );
    prevCartFooterInsetRef.current = cartFooterInset;

    const layoutModeChanged =
      prevIsCompactRef.current !== null &&
      prevIsCompactRef.current !== isCompact;
    prevIsCompactRef.current = isCompact;

    const shouldSnapToDefault =
      layoutModeChanged ||
      routeChanged ||
      goToCartInsetChanged ||
      cartFooterInsetChanged;

    if (hasCustomPosition && !shouldSnapToDefault) {
      return;
    }

    if (shouldSnapToDefault) {
      setHasCustomPosition(false);
    }

    posX.value = withSpring(defaultX, SPRING_CONFIG);
    posY.value = withSpring(defaultY, SPRING_CONFIG);
    dragStartX.value = defaultX;
    dragStartY.value = defaultY;
  }, [
    cartFooterInset,
    defaultX,
    defaultY,
    dragStartX,
    dragStartY,
    goToCartInset,
    bottomReserved,
    hasCustomPosition,
    isCompact,
    pathname,
    posX,
    posY,
  ]);

  useEffect(() => {
    if (!setBottomInset) return;

    const inset = isHomeTab(pathname)
      ? pillHeight + FLOAT_GAP + getTabBarReservedHeight(insets.bottom)
      : 0;

    setBottomInset(inset);

    return () => {
      setBottomInset(0);
    };
  }, [insets.bottom, pathname, pillHeight, setBottomInset]);

  const floatCopy = useMemo(() => getFloatCopy(activeOrders), [activeOrders]);
  const { label, action: actionLabel } = floatCopy;

  const openDelivery = useCallback(() => {
    if (shouldOpenSheet(activeOrders)) {
      onOpenSheet();
      return;
    }

    const order = activeOrders[0];
    const prevStatus =
      order.orderStatus?.toLowerCase() ?? OrderStatus.CONFIRMED;
    router.navigate(`/(orderDetail)/${order._id}?prevStatus=${prevStatus}`);
  }, [activeOrders, onOpenSheet]);

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
        const maxX = SCREEN_WIDTH - pillWidthShared.value - HORIZONTAL_MARGIN;
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
          Math.min(Math.max(minYShared.value, posY.value), maxYShared.value),
          SPRING_CONFIG,
        );
      });

    return Gesture.Exclusive(tapGesture, panGesture);
  }, [
    dragStartX,
    dragStartY,
    isDragging,
    markCustomPosition,
    minYShared,
    maxYShared,
    openDelivery,
    pillWidthShared,
    posX,
    posY,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: posX.value,
    top: posY.value,
    zIndex: 100,
    transform: [{ scale: isDragging.value ? 1.02 : 1 }],
  }));

  return (
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
  );
});

const ActiveDeliveryFloat = ({
  homeVariant = "full",
}: ActiveDeliveryFloatProps) => {
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const isGuestUser = useSelector(
    (state: RootState) => state?.auth?.userData?.isGuestUser,
  );
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  useOrderStatusListener();

  const { data, refetch } = useFetchActiveDeliveriesQuery(
    {
      userId,
      status: ACTIVE_FLOAT_STATUS_QUERY,
      limit: 20,
      page: 1,
    },
    { skip: !userId || isGuestUser },
  );

  // useEffect(() => {
  //   if (appState === "active" && userId && !isGuestUser) {
  //     refetch();
  //   }
  // }, [appState, refetch, userId, isGuestUser]);

  const activeOrders = useMemo(
    () => (data?.orders ?? []) as ActiveFloatOrder[],
    [data?.orders],
  );

  const isHiddenOnDetail = useMemo(() => {
    if (activeOrders.length !== 1) return false;
    const orderId = String(activeOrders[0]?._id ?? "");
    return orderId.length > 0 && pathname.includes(orderId);
  }, [activeOrders, pathname]);

  const showPill =
    !!userId &&
    !isGuestUser &&
    activeOrders.length > 0 &&
    !isHiddenOnDetail &&
    !sheetOpen;

  const openSheet = useCallback(() => {
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
  }, []);

  if (!userId || activeOrders.length === 0) {
    return null;
  }

  if (isHiddenOnDetail && !sheetOpen) {
    return null;
  }

  return (
    <>
      {showPill && (
        <ActiveDeliveryFloatPill
          activeOrders={activeOrders}
          homeVariant={homeVariant}
          onOpenSheet={openSheet}
        />
      )}

      {sheetOpen && (
        <ActiveDeliverySheet orders={activeOrders} onClose={closeSheet} />
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
