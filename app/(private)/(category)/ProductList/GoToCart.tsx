import React, { memo, useCallback, useLayoutEffect, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, G } from "react-native-svg";

import { staticImage } from "../CategoryList/utils";
import { Colors } from "@/constants/Colors";
import { FREE_DELIVERY_MIN } from "@/constants/Delivery";
import { calculateTotalAmountMrp } from "@/components/cart/utils";
import { RootState } from "@/types/global";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import {
  getCartSubtotal,
  getFreeDeliveryRemaining,
  hasFreeDelivery,
} from "@/utils/deliveryFee";
import { formatNumber } from "@/utils/utils";
import { useGoToCartInsetActions } from "@/contexts/DeliveryFloatContext";

const SUGAR_PROMO_MIN = 1000;
const CARD_RADIUS = 20;
const MILESTONE_SIZE = 36;
const RING_SIZE = 42;

type GoToCartProps = {
  isCart?: boolean;
  /** When true, bar is positioned by GoToCartWrapper instead of floating absolutely */
  embedded?: boolean;
};

type Milestone = {
  id: string;
  threshold: number;
  icon: keyof typeof Ionicons.glyphMap;
  rewardLabel: string;
};

const MILESTONES: Milestone[] = [
  {
    id: "delivery",
    threshold: FREE_DELIVERY_MIN,
    icon: "bicycle-outline",
    rewardLabel: "FREE delivery",
  },
  {
    id: "sugar",
    threshold: SUGAR_PROMO_MIN,
    icon: "gift-outline",
    rewardLabel: "1 kg sugar free",
  },
];

function MilestoneRing({
  progress,
  unlocked,
}: {
  progress: number;
  unlocked: boolean;
}) {
  const stroke = unlocked ? Colors.light.mediumGreen : "#3B82F6";
  const track = unlocked ? "rgba(76,187,94,0.25)" : "rgba(59,130,246,0.18)";
  const circumference = 2 * Math.PI * 17;
  const dashOffset = circumference * (1 - Math.min(progress, 1));

  return (
    <Svg width={RING_SIZE} height={RING_SIZE} style={styles.milestoneRing}>
      <Circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={17}
        stroke={track}
        strokeWidth={2.5}
        fill="transparent"
      />
      {!unlocked ? (
        <G rotation={-90} origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={17}
            stroke={stroke}
            strokeWidth={2.5}
            fill="transparent"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </G>
      ) : null}
    </Svg>
  );
}

function MilestoneTrack({ subtotal }: { subtotal: number }) {
  const overallProgress = Math.min(subtotal / SUGAR_PROMO_MIN, 1);

  return (
    <View style={styles.milestoneRow}>
      <View style={styles.milestoneLineTrack}>
        <View
          style={[styles.milestoneLineFill, { width: `${overallProgress * 100}%` }]}
        />
      </View>

      {MILESTONES.map((milestone, index) => {
        const unlocked = subtotal >= milestone.threshold;
        const isNext =
          !unlocked &&
          (index === 0 || subtotal >= MILESTONES[index - 1].threshold);
        const progress = Math.min(subtotal / milestone.threshold, 1);

        return (
          <View key={milestone.id} style={styles.milestoneItem}>
            <View style={styles.milestoneIconWrap}>
              {isNext ? (
                <MilestoneRing progress={progress} unlocked={unlocked} />
              ) : null}
              <View
                style={[
                  styles.milestoneCircle,
                  unlocked && styles.milestoneCircleUnlocked,
                  isNext && styles.milestoneCircleActive,
                ]}
              >
                <Ionicons
                  name={milestone.icon}
                  size={16}
                  color={unlocked ? Colors.light.white : Colors.light.darkGreen}
                />
              </View>
              <View
                style={[
                  styles.milestoneBadge,
                  unlocked ? styles.milestoneBadgeDone : styles.milestoneBadgeLocked,
                ]}
              >
                <Ionicons
                  name={unlocked ? "checkmark" : "lock-closed"}
                  size={9}
                  color={Colors.light.white}
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function PromoIncentive({
  subtotal,
  compact,
}: {
  subtotal: number;
  compact?: boolean;
}) {
  const deliveryUnlocked = hasFreeDelivery(subtotal);
  const freeDeliveryRemaining = getFreeDeliveryRemaining(subtotal);
  const sugarPromoRemaining = Math.max(SUGAR_PROMO_MIN - subtotal, 0);

  const { remaining, rewardLabel } = useMemo(() => {
    if (!deliveryUnlocked) {
      return {
        remaining: freeDeliveryRemaining,
        rewardLabel: "FREE delivery",
      };
    }
    if (sugarPromoRemaining > 0) {
      return {
        remaining: sugarPromoRemaining,
        rewardLabel: "1 kg sugar free",
      };
    }
    return { remaining: 0, rewardLabel: "" };
  }, [deliveryUnlocked, freeDeliveryRemaining, sugarPromoRemaining]);

  const allUnlocked = deliveryUnlocked && sugarPromoRemaining === 0;

  return (
    <View style={[styles.promoSection, compact && styles.promoSectionCompact]}>
      <MilestoneTrack subtotal={subtotal} />

      <View style={styles.promoMessageRow}>
        {allUnlocked ? (
          <Text style={styles.promoText}>
            All offers unlocked on this order
          </Text>
        ) : (
          <>
            <Text style={styles.promoText}>
              Add{" "}
              <Text style={styles.promoAmount}>₹{formatNumber(remaining)}</Text>{" "}
              more for
            </Text>
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardBadgeText}>{rewardLabel}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function CartSummaryBar({
  cartItems,
  subtotal,
  savings,
  thumbnail,
  onPress,
}: {
  cartItems: number;
  subtotal: number;
  savings: number;
  thumbnail: string | null;
  onPress: () => void;
}) {
  return (
    <View style={styles.cartSection}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.cartSummaryPressable,
          pressed && styles.pressed,
        ]}
      >
        <Image
          source={{ uri: thumbnail || staticImage }}
          style={styles.thumbnail}
          contentFit="cover"
        />

        <View style={styles.priceBlock}>
          <View style={styles.priceRow}>
            <Text style={styles.totalPrice}>₹{formatNumber(subtotal)}</Text>
            {savings > 0 ? (
              <Text style={styles.savingsText}>
                ₹{formatNumber(savings)} saved
              </Text>
            ) : null}
          </View>
          <View style={styles.itemCountRow}>
            <Text style={styles.itemCountText}>
              {cartItems} {cartItems === 1 ? "item" : "items"}
            </Text>
            <Ionicons
              name="chevron-up"
              size={14}
              color={Colors.light.mediumGrey}
            />
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.proceedButton,
          pressed && styles.proceedButtonPressed,
        ]}
      >
        <Text style={styles.proceedText}>Proceed</Text>
      </Pressable>
    </View>
  );
}

const GoToCart = ({ isCart = false, embedded = false }: GoToCartProps) => {
  const insets = useSafeAreaInsets();
  const {
    setGoToCartInset,
    publishGoToCartInsetEstimate,
    setGoToCartInsetMeasured,
  } = useGoToCartInsetActions();
  const userId = useSelector((state: RootState) => state.auth?.userData?._id);

  const { data: cartData } = useFetchCartQuery({ userId }, { skip: !userId });

  const cartItemCount = cartData?.cart?.items?.length ?? 0;
  const cartProducts = cartData?.cart?.items ?? [];

  const subtotal = useMemo(
    () => getCartSubtotal(cartProducts),
    [cartProducts],
  );

  const savings = useMemo(() => {
    const mrp = calculateTotalAmountMrp(cartProducts);
    return Math.max(mrp - subtotal, 0);
  }, [cartProducts, subtotal]);

  const thumbnail = useMemo(() => {
    const lastItem = cartProducts[cartProducts.length - 1];
    return lastItem?.productDetails?.image ?? null;
  }, [cartProducts]);

  const navigateToCart = () => {
    router.navigate("/(cartScreen)/cartScreen");
  };

  const publishFloatingInset = useCallback(() => {
    if (isCart) return;

    if (!cartItemCount) {
      setGoToCartInset?.(0);
      return;
    }

    publishGoToCartInsetEstimate?.();
  }, [cartItemCount, isCart, publishGoToCartInsetEstimate, setGoToCartInset]);

  useLayoutEffect(() => {
    publishFloatingInset();
  }, [publishFloatingInset]);

  useFocusEffect(
    useCallback(() => {
      publishFloatingInset();
    }, [publishFloatingInset]),
  );

  const handleBarLayout = (height: number) => {
    if (isCart || !cartItemCount || height <= 0) return;
    setGoToCartInsetMeasured?.(height);
  };

  if (!cartItemCount) return null;

  if (isCart) {
    return (
      <View style={styles.inlineWrapper}>
        <PromoIncentive subtotal={subtotal} compact />
      </View>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        embedded ? styles.embeddedRoot : styles.floatingRoot,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
      onLayout={(event) => handleBarLayout(event.nativeEvent.layout.height)}
    >
      <View style={styles.card}>
        <PromoIncentive subtotal={subtotal} />
        <CartSummaryBar
          cartItems={cartItemCount}
          subtotal={subtotal}
          savings={savings}
          thumbnail={thumbnail}
          onPress={navigateToCart}
        />
      </View>
    </View>
  );
};

export default memo(GoToCart);

const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  android: {
    elevation: 12,
  },
  default: {},
});

const styles = StyleSheet.create({
  floatingRoot: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  embeddedRoot: {
    width: "100%",
  },
  inlineWrapper: {
    marginBottom: 12,
  },
  card: {
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    overflow: "hidden",
    backgroundColor: Colors.light.white,
    ...shadow,
  },
  promoSection: {
    backgroundColor: Colors.light.softGrey_2,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
  },
  promoSectionCompact: {
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    paddingHorizontal: 4,
    minHeight: RING_SIZE,
  },
  milestoneLineTrack: {
    position: "absolute",
    left: 28,
    right: 28,
    top: MILESTONE_SIZE / 2,
    height: 3,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.15)",
  },
  milestoneLineFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#3B82F6",
  },
  milestoneItem: {
    zIndex: 1,
  },
  milestoneIconWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneRing: {
    position: "absolute",
  },
  milestoneCircle: {
    width: MILESTONE_SIZE,
    height: MILESTONE_SIZE,
    borderRadius: MILESTONE_SIZE / 2,
    backgroundColor: Colors.light.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.light.lightGrey,
  },
  milestoneCircleUnlocked: {
    backgroundColor: Colors.light.mediumGreen,
    borderColor: Colors.light.mediumGreen,
  },
  milestoneCircleActive: {
    borderColor: "#3B82F6",
  },
  milestoneBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.light.white,
  },
  milestoneBadgeDone: {
    backgroundColor: "#3B82F6",
  },
  milestoneBadgeLocked: {
    backgroundColor: Colors.light.mediumLightGrey,
  },
  promoMessageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  promoText: {
    color: Colors.light.darkGrey,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Montserrat_500Medium",
  },
  promoAmount: {
    fontFamily: "Montserrat_700Bold",
    color: Colors.light.darkGreen,
  },
  rewardBadge: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rewardBadgeText: {
    color: Colors.light.white,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: "Montserrat_700Bold",
  },
  cartSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: Colors.light.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.lightGrey,
  },
  cartSummaryPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.85,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.light.softGrey_1,
  },
  priceBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 6,
  },
  totalPrice: {
    color: Colors.light.darkGreen,
    fontSize: 18,
    lineHeight: 22,
    fontFamily: "Montserrat_700Bold",
  },
  savingsText: {
    color: Colors.light.mediumGreen,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Montserrat_600SemiBold",
  },
  itemCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  itemCountText: {
    color: Colors.light.mediumGrey,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: "Montserrat_500Medium",
  },
  proceedButton: {
    backgroundColor: Colors.light.lightYellow,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    minWidth: 108,
    alignItems: "center",
    justifyContent: "center",
  },
  proceedButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  proceedText: {
    color: Colors.light.darkGreen,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: "Raleway_700Bold",
  },
});
