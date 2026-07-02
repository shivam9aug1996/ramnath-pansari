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
import { calculateTotalAmountMrp } from "@/components/cart/utils";
import { RootState } from "@/types/global";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import { useCachedOffers } from "@/hooks/useCachedOffers";
import {
  getCartSubtotal,
  getPaidCartSubtotal,
} from "@/utils/deliveryFee";
import {
  buildAdminOfferMilestones,
  buildVisibleCartMilestones,
  getMaxMilestoneThreshold,
  getNextMilestone,
  getUnlockedMilestones,
  hasDeliveryOnlyUnlocked,
  shouldShowCartPromoIncentive,
  type OfferMilestone,
} from "@/utils/offerMilestones";
import { mergeCartItemsWithOffers } from "@/utils/applyOptimisticOffers";
import { formatNumber } from "@/utils/utils";
import { useGoToCartInsetActions } from "@/contexts/DeliveryFloatContext";
import { useDeliverySettings } from "@/hooks/useDeliverySettings";

const CARD_RADIUS = 20;
const MILESTONE_SIZE = 26;
const RING_SIZE = 32;

type GoToCartProps = {
  isCart?: boolean;
  /** When true, bar is positioned by GoToCartWrapper instead of floating absolutely */
  embedded?: boolean;
};

function MilestoneRing({
  progress,
}: {
  progress: number;
}) {
  const circumference = 2 * Math.PI * 12;
  const dashOffset = circumference * (1 - Math.min(progress, 1));
  if (Platform.OS === "web") {
    return (
      <View
        style={[
          styles.milestoneRing,
          {
            width: RING_SIZE,
            height: RING_SIZE,
            borderRadius: RING_SIZE / 2,
            borderWidth: 2,
            borderColor: Colors.light.mediumGreen,
            opacity: 0.35 + progress * 0.65,
          },
        ]}
      />
    );
  }
  return (
    <Svg width={RING_SIZE} height={RING_SIZE} style={styles.milestoneRing}>
      <Circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={12}
        stroke="rgba(25,75,56,0.12)"
        strokeWidth={2}
        fill="transparent"
      />
      <G rotation={-90} originX={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={12}
          stroke={Colors.light.mediumGreen}
          strokeWidth={2}
          fill="transparent"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}

function MilestoneTrack({
  subtotal,
  milestones,
}: {
  subtotal: number;
  milestones: OfferMilestone[];
}) {
  const maxThreshold = getMaxMilestoneThreshold(milestones);
  const overallProgress = Math.min(subtotal / maxThreshold, 1);

  return (
    <View style={styles.milestoneTrackWrap}>
      <View style={styles.milestoneRow}>
        <View style={styles.milestoneLineTrack}>
          <View
            style={[
              styles.milestoneLineFill,
              { width: `${overallProgress * 100}%` },
            ]}
          />
        </View>

        {milestones.map((milestone, index) => {
          const unlocked = subtotal >= milestone.threshold;
          const isNext =
            !unlocked &&
            (index === 0 || subtotal >= milestones[index - 1].threshold);
          const progress = Math.min(subtotal / milestone.threshold, 1);

          return (
            <View key={milestone.id} style={styles.milestoneItem}>
              <View style={styles.milestoneIconWrap}>
                {isNext ? <MilestoneRing progress={progress} /> : null}
                <View
                  style={[
                    styles.milestoneCircle,
                    unlocked && styles.milestoneCircleUnlocked,
                    isNext && styles.milestoneCircleActive,
                  ]}
                >
                  <Ionicons
                    name={milestone.icon}
                    size={12}
                    color={
                      unlocked
                        ? Colors.light.white
                        : isNext
                          ? Colors.light.darkGreen
                          : Colors.light.mediumLightGrey
                    }
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function BenefitChip({
  label,
  applied,
}: {
  label: string;
  applied: boolean;
}) {
  return (
    <View
      style={[
        styles.benefitChip,
        applied ? styles.benefitChipApplied : styles.benefitChipPending,
      ]}
    >
      {applied ? (
        <Ionicons
          name="checkmark"
          size={10}
          color={Colors.light.mediumGreen}
          style={styles.benefitChipIcon}
        />
      ) : null}
      <Text
        style={[
          styles.benefitChipText,
          applied ? styles.benefitChipTextApplied : styles.benefitChipTextPending,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function PromoIncentive({
  subtotal,
  milestones,
  hasAdminOffers,
  deliveryUnlocked,
  compact,
}: {
  subtotal: number;
  milestones: OfferMilestone[];
  hasAdminOffers: boolean;
  deliveryUnlocked: boolean;
  compact?: boolean;
}) {
  const unlocked = useMemo(
    () => getUnlockedMilestones(milestones, subtotal),
    [milestones, subtotal],
  );

  const next = useMemo(
    () => getNextMilestone(milestones, subtotal),
    [milestones, subtotal],
  );

  const allUnlocked = !next && hasAdminOffers;

  const benefitChips = useMemo(() => {
    const chips: { key: string; label: string; applied: boolean }[] = [];

    unlocked.forEach((milestone) => {
      chips.push({
        key: milestone.id,
        label: milestone.shortLabel,
        applied: true,
      });
    });

    if (next && !allUnlocked) {
      next.rewardLabels.forEach((label) => {
        chips.push({ key: `next-${label}`, label, applied: false });
      });
    }

    if (chips.length === 0 && deliveryUnlocked) {
      chips.push({ key: "delivery", label: "FREE delivery", applied: true });
    }

    return chips;
  }, [allUnlocked, deliveryUnlocked, next, unlocked]);

  return (
    <View style={[styles.promoSection, compact && styles.promoSectionCompact]}>
      <View style={styles.promoHeader}>
        <Text style={styles.promoTitle}>Order benefits</Text>
        {next ? (
          <Text style={styles.promoMeta}>
            ₹{formatNumber(next.remaining)} to next
          </Text>
        ) : allUnlocked || deliveryUnlocked ? (
          <Text style={styles.promoMetaAll}>All active</Text>
        ) : null}
      </View>

      <MilestoneTrack subtotal={subtotal} milestones={milestones} />

      {benefitChips.length > 0 ? (
        <View style={styles.benefitChipRow}>
          {benefitChips.map((chip) => (
            <BenefitChip
              key={chip.key}
              label={chip.label}
              applied={chip.applied}
            />
          ))}
        </View>
      ) : null}
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
  const deliverySettings = useDeliverySettings();

  const { data: cartData } = useFetchCartQuery({ userId }, { skip: !userId });
  const cachedOffers = useCachedOffers();

  const adminOfferMilestones = useMemo(
    () => buildAdminOfferMilestones(cachedOffers),
    [cachedOffers],
  );

  const milestones = useMemo(
    () =>
      buildVisibleCartMilestones(
        cachedOffers,
        deliverySettings.freeDeliveryMin,
      ),
    [cachedOffers, deliverySettings.freeDeliveryMin],
  );

  const cartProducts = useMemo(
    () =>
      mergeCartItemsWithOffers(
        cartData?.cart?.items ?? [],
        cachedOffers,
      ),
    [cartData?.cart?.items, cachedOffers],
  );

  const cartItemCount = cartProducts.length;

  const subtotal = useMemo(
    () => getCartSubtotal(cartProducts),
    [cartProducts],
  );

  const paidSubtotal = useMemo(
    () => getPaidCartSubtotal(cartProducts),
    [cartProducts],
  );

  const showPromoIncentive = useMemo(
    () => shouldShowCartPromoIncentive(cachedOffers, paidSubtotal),
    [cachedOffers, paidSubtotal],
  );

  const deliveryUnlocked = useMemo(
    () =>
      hasDeliveryOnlyUnlocked(
        cachedOffers,
        paidSubtotal,
        deliverySettings.freeDeliveryMin,
      ),
    [cachedOffers, paidSubtotal, deliverySettings.freeDeliveryMin],
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
    if (!showPromoIncentive) return null;

    return (
      <View style={styles.inlineWrapper}>
        <PromoIncentive
          subtotal={paidSubtotal}
          milestones={milestones}
          hasAdminOffers={adminOfferMilestones.length > 0}
          deliveryUnlocked={deliveryUnlocked}
          compact
        />
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
        {showPromoIncentive ? (
          <PromoIncentive
            subtotal={paidSubtotal}
            milestones={milestones}
            hasAdminOffers={adminOfferMilestones.length > 0}
            deliveryUnlocked={deliveryUnlocked}
          />
        ) : null}
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
    backgroundColor: Colors.light.white,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.lightGrey,
  },
  promoSectionCompact: {
    borderRadius: CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.lightGrey,
    overflow: "hidden",
  },
  promoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  promoTitle: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 14,
    lineHeight: 18,
    color: Colors.light.darkGreen,
  },
  promoMeta: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 11,
    lineHeight: 14,
    color: Colors.light.mediumGreen,
  },
  promoMetaAll: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 11,
    lineHeight: 14,
    color: Colors.light.mediumGreen,
  },
  milestoneTrackWrap: {
    paddingVertical: 2,
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
    left: 20,
    right: 20,
    top: RING_SIZE / 2,
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(25,75,56,0.08)",
  },
  milestoneLineFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: Colors.light.mediumGreen,
  },
  milestoneItem: {
    zIndex: 1,
    flex: 1,
    alignItems: "center",
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
    borderColor: Colors.light.mediumGreen,
    backgroundColor: "#EEF8F3",
  },
  benefitChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  benefitChip: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  benefitChipApplied: {
    backgroundColor: "#EEF8F3",
    borderWidth: 1,
    borderColor: "rgba(42,175,127,0.25)",
  },
  benefitChipPending: {
    backgroundColor: Colors.light.softGrey_1,
    borderWidth: 1,
    borderColor: Colors.light.lightGrey,
  },
  benefitChipIcon: {
    marginRight: 3,
  },
  benefitChipText: {
    flexShrink: 1,
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 11,
    lineHeight: 14,
  },
  benefitChipTextApplied: {
    color: Colors.light.darkGreen,
  },
  benefitChipTextPending: {
    color: Colors.light.mediumGrey,
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
