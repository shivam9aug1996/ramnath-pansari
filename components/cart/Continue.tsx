import { Platform, StyleSheet, Text, View } from "react-native";
import React, { lazy, Suspense, useMemo, useState } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Colors } from "@/constants/Colors";
import { ThemedView } from "../ThemedView";
import { ThemedText } from "../ThemedText";
import { formatNumber, showToast } from "@/utils/utils";
import { useDispatch } from "react-redux";
import { router } from "expo-router";
import { calculateTotalAmount, findCartChanges } from "./utils";
import {
  useLazyFetchCartQuery,
  useSyncCartMutation,
} from "@/redux/features/cartSlice";
import { useLazyFetchAddressQuery } from "@/redux/features/addressSlice";
import { setCheckoutFlow } from "@/redux/features/orderSlice";
import GoToCart from "@/app/(private)/(category)/ProductList/GoToCart";
const Button = lazy(() => import("../Button"));
const Continue = ({
  cartData,
  headerVisible,
  tabBarHeight,
  isCartProcessing,
  userId,
}) => {
  const [fetchCartData, { isLoading: isCartLoading }] = useLazyFetchCartQuery();
  const [fetchAddress, { isFetching: fetchingAddressLoading }] =
    useLazyFetchAddressQuery();
  const [syncCart, { isLoading: isSyncCartLoading }] = useSyncCartMutation();
  const [isDisabled, setIsDisabled] = useState(false);
  const totalAmount = useMemo(() => {
    return calculateTotalAmount(cartData?.cart?.items)?.toFixed(2);
  }, [cartData?.cart?.items]);
  const cartItems = cartData?.cart?.items?.length || 0;

  const dispatch = useDispatch();
  const animatedHeaderStyle2 = useAnimatedStyle(() => {
    const translateY = withTiming(headerVisible.value === 1 ? 0 : 350, {
      duration: 700,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    const height = withTiming(headerVisible.value === 1 ? 190 : 50, {
      duration: 700,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    return { transform: [{ translateY }], height };
  });

  const pb = {
    paddingBottom:
      Platform.OS === "android"
        ? tabBarHeight === 0
          ? tabBarHeight + 45
          : tabBarHeight - 20
        : tabBarHeight === 0
          ? tabBarHeight + 10
          : tabBarHeight - 60,
  };
  return (
    <Animated.View style={[styles.animatedContainer]}>
      <>
        {cartItems ? (
          <>
            <View style={styles.divider} />
            <ThemedView style={styles.totalContainer}>
              <ThemedText style={styles.totalLabel}>{"Total"}</ThemedText>
              <ThemedText style={styles.totalAmount}>{`₹ ${formatNumber(
                totalAmount
              )}`}</ThemedText>
            </ThemedView>

            <Suspense fallback={null}>
              <Button
                isLoading={
                  isDisabled ||
                  isSyncCartLoading ||
                  isCartLoading ||
                  fetchingAddressLoading ||
                  isCartProcessing
                }
                disabled={
                  isDisabled ||
                  isSyncCartLoading ||
                  isCartLoading ||
                  fetchingAddressLoading ||
                  isCartProcessing
                }
                onPress={async () => {
                  dispatch(setCheckoutFlow(true));
                  setIsDisabled(true);
                  await syncCart({
                    body: {},
                    params: { userId: userId },
                  })?.unwrap();
                  const newCartData = await fetchCartData(
                    { userId },
                    false
                  )?.unwrap();

                  let changes = findCartChanges(cartData, newCartData);

                  if (
                    changes?.priceChanges.length > 0 ||
                    changes?.removedItems.length > 0
                  ) {
                    showToast({
                      type: "info",
                      text2:
                        "Product details are changed. Please review before checkout.",
                    });
                    setIsDisabled(false);
                  } else {
                    await fetchAddress(
                      {
                        userId: userId,
                      },
                      true
                    )?.unwrap();
                    setIsDisabled(false);
                    router.push({
                      pathname: "/(address)/addressList",
                    });
                  }
                }}
                title={
                  isCartProcessing
                    ? "Processing your cart..."
                    : `Continue To Checkout`
                }
              />
            </Suspense>
          </>
        ) : null}

        <View style={pb} />
      </>
    </Animated.View>
  );
};

export default Continue;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 37,
    alignItems: "center",
    paddingBottom: 17,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Raleway_700Bold",
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Montserrat_400Regular",
  },
  listContainer: {
    paddingBottom: 20,
    paddingTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.mediumLightGrey,
    marginHorizontal: 34,
    opacity: 0.15,
    marginVertical: 25,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontFamily: "Raleway_500Medium",
    fontSize: 14,
  },
  totalAmount: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 22,
    color: Colors.light.lightGreen,
  },
  footerSpace: {
    // flex: 1,
    //  marginBottom: Platform.OS === "android" ? tabBarHeight : 15,
  },
  animatedContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.background,
    zIndex: 999,
  },
});
