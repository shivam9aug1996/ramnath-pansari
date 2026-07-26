import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { setPromoDockedInline } from "@/redux/features/homePromoSlice";
import HomeProductPromo from "./HomeProductPromo";
import DeferredFadeIn from "./DeferredFadeIn";
import { resolveIsAdminUser, resolveIsDriverUser } from "@/utils/authRoles";
import { getTabBarReservedHeight } from "@/utils/bottomChrome";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const CARD_W = 92;
const CARD_H = 132;
const CARD_RADIUS = 14;
const CARD_BOTTOM_OFFSET = 80;
const PromoDocked = () => {
  const promoDockedInline = useSelector(
    (state: RootState) => state?.homePromo?.promoDockedInline,
  );
  const insets = useSafeAreaInsets();
  const bottom = getTabBarReservedHeight(insets.bottom)+ CARD_BOTTOM_OFFSET;

  const userData = useSelector((state: RootState) => state?.auth?.userData);
  const onboardingDone = useSelector(
    (s: RootState) => Boolean(s.auth.hasSeenOnboarding),
  );
  const isCustomer = !userData?.isAdminUser && !userData?.isDriverUser;


  const dispatch = useDispatch();

  return (
    <>
      {!promoDockedInline && onboardingDone && isCustomer ? (
        <DeferredFadeIn
          style={[styles.card, { bottom }]}
          delay={250}
        >
          <HomeProductPromo
            variant="float"
            onFloatClose={() => dispatch(setPromoDockedInline(true))}
          />
        </DeferredFadeIn>
      ) : null}
    </>
  );
};

export default PromoDocked;

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    zIndex: 120,
    width: CARD_W,
    height: CARD_H,
    right: 14,
    borderRadius: CARD_RADIUS,
  },
});
