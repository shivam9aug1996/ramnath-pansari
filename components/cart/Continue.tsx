import { Platform, StyleSheet, Text, View, Image, Pressable } from "react-native";
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
import { calculateTotalAmount, calculateTotalAmountMrp, findCartChanges } from "./utils";
import {
  useLazyFetchCartQuery,
  useSyncCartMutation,
} from "@/redux/features/cartSlice";
import { useLazyFetchAddressQuery } from "@/redux/features/addressSlice";
import { setCheckoutFlow } from "@/redux/features/orderSlice";
import GoToCart from "@/app/(private)/(category)/ProductList/GoToCart";
import { calculateSavingsAndFreebies } from "@/app/(private)/(orderDetail)/utils";
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
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  const totalAmount = useMemo(() => {
    return calculateTotalAmount(cartData?.cart?.items)?.toFixed(2);
  }, [cartData?.cart?.items]);
  const totalAmountMrp = useMemo(() => {
    return calculateTotalAmountMrp(cartData?.cart?.items)?.toFixed(2);
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
          ? tabBarHeight +10
          : tabBarHeight - 40
        : tabBarHeight === 0
          ? tabBarHeight + 10
          : tabBarHeight - 60,
  };

  const { totalOriginalPrice, freebieValue, freebies } = useMemo(() => {
    return calculateSavingsAndFreebies(cartData?.cart?.items || []);
  }, [cartData?.cart?.items]);

  const regularSavings = totalOriginalPrice - parseFloat(totalAmount);
  const totalSavings = regularSavings + freebieValue;
if(!cartItems) return null;
  return (
    <Animated.View style={[styles.animatedContainer]}>
     
      <>
        {cartItems ? (
          <>
            {/* <View style={styles.divider} /> */}
            
            {/* Price Summary Button */}
            <Pressable 
              style={styles.priceDetailsButton} 
              onPress={() => setShowPriceDetails(!showPriceDetails)}
            >
              <ThemedText style={styles.priceDetailsText}>
                {showPriceDetails ? "Hide Price Details" : "View Price Details"}
              </ThemedText>
            </Pressable>

            {/* Collapsible Price Details */}
            {showPriceDetails && (
              <View style={styles.priceDetailsContainer}>
                <ThemedView style={styles.totalContainer}>
                  <ThemedText style={styles.totalLabel}>{"MRP"}</ThemedText>
                  <ThemedText style={styles.mrpAmount}>{`₹ ${formatNumber(
                    totalOriginalPrice
                  )}`}</ThemedText>
                </ThemedView>
                
                {regularSavings > 0 && (
                  <ThemedView style={styles.totalContainer}>
                    <ThemedText style={styles.totalLabel}>{"Regular Savings"}</ThemedText>
                    <ThemedText style={styles.savingsAmount}>{`₹ ${formatNumber(
                      regularSavings.toFixed(2)
                    )}`}</ThemedText>
                  </ThemedView>
                )}

                {freebieValue > 0 && (
                  <ThemedView style={[styles.totalContainer, styles.freebieSection]}>
                    <View style={styles.freebiesContainer}>
                      <ThemedText style={styles.totalLabel}>{"Freebies Value"}</ThemedText>
                      <View style={styles.freebiesList}>
                        {freebies.map((freebie, index) => (
                          <View key={index} style={styles.freebieItem}>
                            {freebie.image && (
                              <Image
                                source={{ uri: freebie.image }}
                                style={styles.freebieImage}
                                resizeMode="contain"
                              />
                            )}
                            <View style={styles.freebieDetails}>
                              <View style={styles.quantityBadge}>
                                <Text style={styles.quantityText}>{freebie.quantity}x</Text>
                              </View>
                              <Text style={styles.freebieName} numberOfLines={1}>
                                {freebie.name}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                    <ThemedText style={styles.savingsAmount}>{`₹ ${formatNumber(
                      freebieValue.toFixed(2)
                    )}`}</ThemedText>
                  </ThemedView>
                )}

                {totalSavings > 0 && (
                  <ThemedView style={[styles.totalContainer, styles.totalSavingsContainer]}>
                    <ThemedText style={styles.totalLabel}>{"Total Savings"}</ThemedText>
                    <ThemedText style={[styles.savingsAmount, styles.totalSavings]}>{`₹ ${formatNumber(
                      totalSavings.toFixed(2)
                    )}`}</ThemedText>
                  </ThemedView>
                )}
              </View>
            )}

            {/* Final amount and button row */}
            <ThemedView style={styles.checkoutContainer}>
              <View style={styles.amountContainer}>
                <ThemedText style={styles.finalTotalLabel}>{"Final Amount"}</ThemedText>
                <ThemedText style={styles.finalTotalAmount}>{`₹ ${formatNumber(
                  totalAmount
                )}`}</ThemedText>
              </View>

              <Suspense fallback={null}>
                <Button
                  variant="cart"
                  wrapperStyle={styles.checkoutButton}
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
                      ? "Processing..."
                      : `Checkout`
                  }
                />
              </Suspense>
            </ThemedView>
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
    marginVertical: 12,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 34,
    paddingVertical: 8,
  },
  totalLabel: {
    fontFamily: "Raleway_500Medium",
    fontSize: 14,
    color: Colors.light.mediumGrey,
  },
  mrpAmount: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 16,
    textDecorationLine: 'line-through',
    color: Colors.light.mediumGrey,
  },
  savingsAmount: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 16,
    color: Colors.light.mediumGreen,
  },
  finalTotalContainer: {
    marginTop: 2,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.light.mediumLightGrey,
  },
  finalTotalLabel: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 14,
  },
  finalTotalAmount: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 20,
    color: Colors.light.lightGreen,
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
    // position: "absolute",
    // bottom: 0,
    // left: 0,
    // right: 0,
    backgroundColor: Colors.light.background,
    paddingBottom:  Platform.OS === "android" ? 0 : 16,
   // marginBottom: Platform.OS === "android" ? -20 : 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  totalSavings: {
    fontSize: 16,
    fontFamily: "Montserrat_700Bold",
  },
  freebiesContainer: {
    flex: 1,
    marginRight: 16,
  },
  freebiesList: {
    marginTop: 4,
    gap: 6,
  },
  freebieItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freebieImage: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: Colors.light.lightGrey + '20',
  },
  freebieDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quantityBadge: {
    backgroundColor: Colors.light.lightGreen + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  quantityText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 10,
    color: Colors.light.lightGreen,
  },
  freebieName: {
    fontFamily: "Raleway_500Medium",
    fontSize: 14,
    color: Colors.light.mediumGrey,
    flex: 1,
  },
  priceDetailsButton: {
    paddingHorizontal: 34,
    paddingVertical: 10,
    marginVertical: 4,
  },
  priceDetailsText: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 14,
    color: Colors.light.lightGreen,
  },
  checkoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 34,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.lightGrey,
    marginTop: 4,
  },
  amountContainer: {
    flex: 1,
    marginRight: 16,
  },
  checkoutButton: {
    marginTop: 0,
    flex: 1,
  },
  priceDetailsContainer: {
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.light.mediumLightGrey + '10',
  },
  freebieSection: {
    paddingVertical: 12,
    backgroundColor: Colors.light.background + '50',
  },
  totalSavingsContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.mediumLightGrey + '20',
    marginTop: 8,
  },
});
