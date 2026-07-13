import {
  Platform,
  StyleSheet,
  View,
  Pressable,
} from "react-native";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { devError, devLog, devWarn } from "@/utils/devLog";
import { Colors } from "@/constants/Colors";
import { ThemedView } from "../ThemedView";
import { ThemedText } from "../ThemedText";
import { formatNumber, showToast } from "@/utils/utils";
import { useDispatch } from "react-redux";
import { router, useFocusEffect } from "expo-router";
import {
  getDeliveryFee,
  getPayableTotalFromItems,
} from "@/utils/deliveryFee";
import {
  cartApi,
  setCartPayableTotals,
  setIsCartOperationProcessing,
  setIsClearCartLoading,
  setNeedToSyncWithBackend,
  useClearCartMutation,
  useFetchCartQuery,
  useLazyBulkUpdateCartQuery,
  useLazyFetchCartQuery,
  useLazyUpdateProductsAsPerCartQuery,
  useReleaseCheckoutHoldsMutation,
  useSyncCartMutation,
} from "@/redux/features/cartSlice";

import { useLazyFetchAddressQuery } from "@/redux/features/addressSlice";
import { setCheckoutFlow } from "@/redux/features/orderSlice";
import { getCartPriceBreakdown } from "@/utils/cartPriceBreakdown";
import { mergeCartItemsWithOffers } from "@/utils/applyOptimisticOffers";
import { useCachedOffers } from "@/hooks/useCachedOffers";
import { offerApi } from "@/redux/features/offerSlice";
import { deliverySettingsApi } from "@/redux/features/deliverySettingsSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import Button from "../Button";
import { useRenderTimer } from "@/hooks/useRenderTimer";
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { applyPostCheckoutCartUpdate } from "@/utils/applyPostCheckoutCartUpdate";
import { removeHeldProductsFromCart } from "@/utils/removeHeldProductsFromCart";
import { useCartFooterInsetActions } from "@/contexts/DeliveryFloatContext";
import { useDeliverySettings } from "@/hooks/useDeliverySettings";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { persistPromoConfigCache } from "@/utils/promoConfigCache";
import { persistStoreConfigCache } from "@/utils/storeConfigCache";
import { storeConfigApi } from "@/redux/features/storeConfigSlice";
import { getStoreClosedCacheHint } from "@/utils/storeConfig";
import { syncStoreConfig } from "@/utils/storeConfigCache";
import { runCheckoutFlow } from "@/utils/runCheckoutFlow";

const Continue = ({ tabBarHeight, isCartProcessing, userId }) => {
  useRenderTimer(`Continue`);
  const {
    setCartFooterInset,
    publishCartFooterInsetEstimate,
    setCartFooterInsetMeasured,
  } = useCartFooterInsetActions();
  const deliverySettings = useDeliverySettings();
  const storeConfig = useStoreConfig();
  const storeClosedCacheHint = useMemo(
    () => getStoreClosedCacheHint(storeConfig),
    [storeConfig],
  );
  const isCartOperationProcessing = useSelector(
    (state: RootState) => state?.cart?.isCartOperationProcessing
  );
  const cachedOffers = useCachedOffers();
  const { data: cartData } = useFetchCartQuery({ userId }, { skip: !userId });

  const mergedCartItems = useMemo(
    () =>
      mergeCartItemsWithOffers(
        cartData?.cart?.items ?? [],
        cachedOffers,
      ),
    [cartData?.cart?.items, cachedOffers],
  );
  const isClearCartLoading = useSelector(
    (state: RootState) => state.cart.isClearCartLoading
  );

  const [fetchCartData, { isLoading: isCartLoading }] = useLazyFetchCartQuery();
  const [fetchAddress, { isFetching: fetchingAddressLoading }] =
    useLazyFetchAddressQuery();
  const [bulkUpdateCart] = useLazyBulkUpdateCartQuery();
  const [updateProductsAsPerCart] = useLazyUpdateProductsAsPerCartQuery();
  const [syncCart, { isLoading: isSyncCartLoading }] = useSyncCartMutation();
  const [releaseCheckoutHolds] = useReleaseCheckoutHoldsMutation();
  const [clearCart] = useClearCartMutation();
  const needToSyncWithBackend = useSelector(
    (state: RootState) => state?.cart?.needToSyncWithBackend
  );
  // const navigation = useNavigation();

  const [isDisabled, setIsDisabled] = useState(false);
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  const priceBreakdown = useMemo(
    () =>
      getCartPriceBreakdown(
        mergedCartItems,
        cachedOffers,
        cartData?.orderDiscount ?? 0,
      ),
    [mergedCartItems, cachedOffers, cartData?.orderDiscount],
  );

  const {
    catalogSubtotal,
    subtotal,
    appliedOrderDiscounts,
    orderDiscount,
    totalSaved,
    freebies,
    hasOfferLines,
  } = priceBreakdown;

  const deliveryFee = useMemo(
    () => getDeliveryFee(subtotal, deliverySettings),
    [subtotal, deliverySettings],
  );

  const payableTotal = useMemo(() => {
    const base = getPayableTotalFromItems(mergedCartItems, deliverySettings);
    return parseFloat(Math.max(0, base - orderDiscount).toFixed(2));
  }, [mergedCartItems, orderDiscount, deliverySettings]);

  const cartItems = mergedCartItems.length || 0;

  const dispatch = useDispatch();

  // useEffect(() => {
  //   latestCartDataRef.current = cartData;
  // }, [cartData?.cart?.items]);

  // devLog(pathname);
  //   useFocusEffect(
  //     // Callback should be wrapped in `React.useCallback` to avoid running the effect too often.
  //     useCallback(() => {
  //       // Invoked whenever the route is focused.
  // devLog("needToSyncWithBackend",needToSyncWithBackend)
  //         if(needToSyncWithBackend.status){
  //           dispatch(setIsCartOperationProcessing(true));

  //         (async()=>{
  //           try {

  //           let updatedCart = store.getState().cartApi.queries[
  //         `fetchCart({"userId":"${userId}"})`
  //       ]?.data;
  //        let payload = updatedCart?.cart?.items?.map((item:any)=>{
  //         return {
  //           productId:item?.productDetails?._id,
  //           quantity:item?.quantity
  //         }
  //       })
  //       payload = payload.filter(
  //         (item: any) =>
  //           item?.productId !== "676da9f75763ded56d43032d"
  //       );
  //           devLog("payload",payload)
  //           await bulkUpdateCart({
  //             body: {
  //               items:payload
  //             },
  //             params: { userId },
  //           })?.unwrap();
  //           await fetchCartData({ userId }, false)?.unwrap();
  //           } catch (error) {

  //           }
  //           dispatch(setNeedToSyncWithBackend({status:false}));
  //           dispatch(setIsCartOperationProcessing(false));
  //          })()
  //         }

  //       // Return function is invoked whenever the route gets out of focus.
  //       return () => {
  //         devLog('This route is now unfocused.');
  //       };
  //     }, [needToSyncWithBackend?.status]));

  //     useEffect(() => {
  //       const unsubscribe = navigation.addListener("tabPress", () => {
  //         if(needToSyncWithBackend.status){
  //           dispatch(setIsCartOperationProcessing(true));

  //         (async()=>{
  //           try {

  //           let updatedCart = store.getState().cartApi.queries[
  //         `fetchCart({"userId":"${userId}"})`
  //       ]?.data;
  //        let payload = updatedCart?.cart?.items?.map((item:any)=>{
  //         return {
  //           productId:item?.productDetails?._id,
  //           quantity:item?.quantity
  //         }
  //       })
  //       payload = payload.filter(
  //         (item: any) =>
  //           item?.productId !== "676da9f75763ded56d43032d"
  //       );
  //           devLog("payload",payload)
  //           await bulkUpdateCart({
  //             body: {
  //               items:payload
  //             },
  //             params: { userId },
  //           })?.unwrap();
  //           await fetchCartData({ userId }, false)?.unwrap();
  //           } catch (error) {

  //           }
  //           dispatch(setNeedToSyncWithBackend({status:false}));
  //           dispatch(setIsCartOperationProcessing(false));
  //          })()
  //         }
  //       });

  //       return unsubscribe;
  //     }, [navigation,needToSyncWithBackend?.status]);

  const pb = {
    paddingBottom:
      Platform.OS === "android"
        ? tabBarHeight === 0
          ? tabBarHeight + 10
          : tabBarHeight - 40
        : tabBarHeight === 0
        ? tabBarHeight + 10
        : tabBarHeight - 60,
  };

  useLayoutEffect(() => {
    if (!cartItems) {
      setCartFooterInset?.(0);
      return;
    }
    publishCartFooterInsetEstimate?.();
  }, [cartItems, publishCartFooterInsetEstimate, setCartFooterInset]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      syncStoreConfig(dispatch, { force: true }).catch(() => {});
    }, [dispatch, userId]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!cartItems) {
        setCartFooterInset?.(0);
        return;
      }
      publishCartFooterInsetEstimate?.();
    }, [cartItems, publishCartFooterInsetEstimate, setCartFooterInset]),
  );

  const handleFooterLayout = (height: number) => {
    if (!cartItems || height <= 0) return;
    setCartFooterInsetMeasured?.(height);
  };

  if (!cartItems) return null;
  return (
    <View
      style={[styles.animatedContainer]}
      onLayout={(event) =>
        handleFooterLayout(event.nativeEvent.layout.height)
      }
    >
      <>
        {cartItems ? (
          <>
            {/* <View style={styles.divider} /> */}

            {/* Price Summary Button */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 5,
                //marginVertical: 4,
              }}
            >
              <Pressable
                style={styles.priceDetailsButton}
                onPress={() => setShowPriceDetails(!showPriceDetails)}
              >
                <ThemedText style={styles.priceDetailsText}>
                  {showPriceDetails
                    ? "Hide Price Details"
                    : "View Price Details"}
                </ThemedText>
              </Pressable>
              <Pressable
                disabled={
                  isDisabled ||
                  isSyncCartLoading ||
                  isCartLoading ||
                  fetchingAddressLoading ||
                  isCartProcessing ||
                  isCartOperationProcessing ||
                  isClearCartLoading
                }
                style={[
                  styles.clearCartButton,
                  {
                    opacity:
                      isDisabled ||
                      isSyncCartLoading ||
                      isCartLoading ||
                      fetchingAddressLoading ||
                      isCartProcessing ||
                      isCartOperationProcessing ||
                      isClearCartLoading
                        ? 0.5
                        : 1,
                  },
                ]}
                onPress={async () => {
                  try {
                    
                    dispatch(setIsClearCartLoading(true));
                    const needToSync = await AsyncStorage.getItem(`cartData-${userId}-needToSync`)     
                    devLog("needToSync654345678",needToSync)
                    if(needToSync === "true"){
                      await AsyncStorage.setItem(`cartData-${userId}`,JSON.stringify([]))
                      dispatch(
                        cartApi.util.updateQueryData("fetchCart", { userId }, (draft) => {
                          draft.cart.items = [];
                        })
                      )
                    }else{

                      await clearCart({
                        body: {},
                        params: { userId },
                      }).unwrap();
                      // await SecureStore.setItemAsync(`cartData-${userId}`,JSON.stringify([]))
                      // await SecureStore.setItemAsync(`cartData-${userId}-needToSync`, "true")
                      await AsyncStorage.setItem(`cartData-${userId}`,JSON.stringify([]))
                      await AsyncStorage.setItem(`cartData-${userId}-needToSync`, "true")
                      await fetchCartData({ userId }, false)?.unwrap();
                    }

                  } catch (error) {
                  } finally {
                    dispatch(setIsClearCartLoading(false));
                  }
                }}
              >
                <ThemedText style={styles.clearCartText}>
                  {"Clear Cart"}
                </ThemedText>
              </Pressable>
            </View>

            {/* Collapsible Price Details */}
            {showPriceDetails && (
              <View style={styles.priceDetailsContainer}>
                <ThemedView
                  style={[styles.totalContainer, styles.subtotalContainer]}
                >
                  <ThemedText style={styles.subtotalLabel}>
                    {"Item Total"}
                  </ThemedText>
                  <ThemedText style={styles.subtotalAmount}>{`₹ ${formatNumber(
                    hasOfferLines ? catalogSubtotal : subtotal,
                  )}`}</ThemedText>
                </ThemedView>

                {freebies.map((freebie, index) => {
                  const lineTotal =
                    (freebie.promoPrice ?? 0) * (freebie.quantity ?? 1);

                  return (
                    <ThemedView key={index} style={styles.totalContainer}>
                      <ThemedText style={styles.offerLineLabel}>
                        {`Offer · ${freebie.quantity}x ${freebie.name}`}
                      </ThemedText>
                      <ThemedText
                        style={
                          lineTotal > 0
                            ? styles.offerLineAmount
                            : styles.savingsAmount
                        }
                      >
                        {lineTotal > 0
                          ? `₹ ${formatNumber(lineTotal)}`
                          : "FREE"}
                      </ThemedText>
                    </ThemedView>
                  );
                })}

                {appliedOrderDiscounts.map((discount) => (
                  <ThemedView
                    key={discount.offerId}
                    style={styles.totalContainer}
                  >
                    <ThemedText style={styles.totalLabel}>
                      {discount.label}
                    </ThemedText>
                    <ThemedText style={styles.savingsAmount}>{`- ₹ ${formatNumber(
                      discount.amount,
                    )}`}</ThemedText>
                  </ThemedView>
                ))}

                {totalSaved > 0 && (
                  <ThemedView style={styles.totalContainer}>
                    <ThemedText style={styles.totalLabel}>
                      {"You saved"}
                    </ThemedText>
                    <ThemedText style={styles.savingsAmount}>{`₹ ${formatNumber(
                      totalSaved,
                    )}`}</ThemedText>
                  </ThemedView>
                )}

                <ThemedView style={styles.totalContainer}>
                  <ThemedText style={styles.totalLabel}>
                    {"Delivery Fee"}
                  </ThemedText>
                  <ThemedText
                    style={
                      deliveryFee === 0
                        ? styles.savingsAmount
                        : styles.deliveryAmount
                    }
                  >
                    {deliveryFee === 0
                      ? "FREE"
                      : `₹ ${formatNumber(deliveryFee)}`}
                  </ThemedText>
                </ThemedView>
              </View>
            )}

            {storeClosedCacheHint ? (
              <ThemedText style={styles.storeClosedNotice}>
                {storeClosedCacheHint}
              </ThemedText>
            ) : null}

            {/* Final amount and button row */}
            <ThemedView style={styles.checkoutContainer}>
              <View style={styles.amountContainer}>
                <ThemedText style={styles.finalTotalLabel}>
                  {"Final Amount"}
                </ThemedText>
                <ThemedText style={styles.finalTotalAmount}>{`₹ ${formatNumber(
                  payableTotal
                )}`}</ThemedText>
              </View>

              <Button
                variant="cart"
                wrapperStyle={styles.checkoutButton}
                isLoading={
                  isCartOperationProcessing ||
                  isDisabled ||
                  isSyncCartLoading ||
                  isCartLoading ||
                  fetchingAddressLoading ||
                  isCartProcessing ||
                 
                  isClearCartLoading
                }
                disabled={
                  isCartOperationProcessing ||
                  isDisabled ||
                  isSyncCartLoading ||
                  isCartLoading ||
                  fetchingAddressLoading ||
                  isCartProcessing ||
                  
                  isClearCartLoading
                }
                onPress={async () => {
                  dispatch(setIsCartOperationProcessing(true));
                  dispatch(setCheckoutFlow(true));
                  setIsDisabled(true);

                  const abortCheckout = () => {
                    setIsDisabled(false);
                    dispatch(setIsCartOperationProcessing(false));
                    dispatch(setCheckoutFlow(false));
                  };

                  const stopCheckoutSpinner = () => {
                    setIsDisabled(false);
                    dispatch(setIsCartOperationProcessing(false));
                  };

                  try {
                    const result = await runCheckoutFlow({
                      userId,
                      cartData,
                      cachedOffers,
                      deliverySettings,
                      storeConfig,
                      orderDiscount,
                      fetchOffers: async () =>
                        dispatch(
                          offerApi.endpoints.fetchOffers.initiate(undefined, {
                            forceRefetch: true,
                          }),
                        ).unwrap(),
                      fetchDeliverySettings: async () =>
                        dispatch(
                          deliverySettingsApi.endpoints.fetchDeliverySettings.initiate(
                            undefined,
                            { forceRefetch: true },
                          ),
                        ).unwrap(),
                      fetchStoreConfig: async () =>
                        dispatch(
                          storeConfigApi.endpoints.fetchStoreConfig.initiate(
                            undefined,
                            { forceRefetch: true },
                          ),
                        ).unwrap(),
                      onPromoConfigPersisted: (offers, delivery) => {
                        persistPromoConfigCache(offers, delivery).catch(() => {});
                      },
                      onStoreConfigPersisted: (config) => {
                        persistStoreConfigCache(config).catch(() => {});
                      },
                      updateProductsAsPerCart: async ({ items }) =>
                        updateProductsAsPerCart({
                          body: { items },
                          params: { userId },
                        })?.unwrap(),
                      bulkUpdateCart: async ({ items }) =>
                        bulkUpdateCart({
                          body: { items },
                          params: { userId },
                        })?.unwrap(),
                      fetchCart: async () =>
                        fetchCartData({ userId }, false)?.unwrap(),
                      applyPostCheckoutCartUpdate: async (newCartData, synced) =>
                        applyPostCheckoutCartUpdate(
                          dispatch,
                          userId,
                          newCartData,
                          synced,
                        ),
                      removeHeldProductsFromCart: async ({
                        heldProductIds,
                        currentCartItems,
                      }) =>
                        removeHeldProductsFromCart({
                          dispatch,
                          userId,
                          heldProductIds,
                          currentCartItems,
                          bulkUpdateCart,
                          fetchCartData,
                        }),
                      markCartSynced: async () => {
                        await AsyncStorage.setItem(
                          `cartData-${userId}-needToSync`,
                          "false",
                        );
                      },
                      releaseCheckoutHolds: async (productIds) => {
                        if (!productIds.length) return;
                        await releaseCheckoutHolds({
                          params: { userId },
                          body: { productIds },
                        }).unwrap();
                      },
                      mergeCartItemsWithOffers,
                    });

                    if (result.status === "proceed") {
                      dispatch(
                        setCartPayableTotals({ total: result.payableTotal }),
                      );
                      try {
                        await fetchAddress({ userId }, true)?.unwrap();
                        stopCheckoutSpinner();
                        router.push({ pathname: "/(address)/addressList" });
                      } catch {
                        await releaseCheckoutHolds({
                          params: { userId },
                          body: { productIds: result.heldProductIds },
                        }).unwrap().catch(() => {});
                        showToast({
                          type: "error",
                          text2:
                            "Checkout could not continue. Please try again.",
                        });
                        abortCheckout();
                      }
                      return;
                    }

                    showToast({
                      type: result.toastType,
                      text2: result.message,
                    });
                    abortCheckout();
                  } catch (error) {
                    devLog("[cart-sync] checkout:failed", error);
                    showToast({
                      type: "error",
                      text2: "Checkout could not continue. Please try again.",
                    });
                    abortCheckout();
                  }
                }}
                title={
                  isCartProcessing || isCartOperationProcessing || isDisabled
                    ? "Processing..."
                    : "Checkout"
                }
              />
            </ThemedView>
          </>
        ) : null}

        <View style={pb} />
      </>
    </View>
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
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    color: Colors.light.mediumGrey,
  },
  baselineAmount: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 16,
    color: Colors.light.darkGrey,
  },
  savingsAmount: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 16,
    color: Colors.light.mediumGreen,
  },
  deliveryAmount: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 16,
    color: Colors.light.darkGrey,
  },
  subtotalContainer: {
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.light.mediumLightGrey + "30",
  },
  subtotalLabel: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 14,
    color: Colors.light.darkGrey,
  },
  subtotalAmount: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 16,
    color: Colors.light.darkGrey,
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.background,
    paddingBottom: Platform.OS === "android" ? 0 : 16,
    // marginBottom: Platform.OS === "android" ? -20 : 16,
    shadowColor: "#000",
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
  offerLineLabel: {
    flex: 1,
    fontFamily: "Raleway_500Medium",
    fontSize: 13,
    color: Colors.light.mediumGrey,
    paddingLeft: 8,
  },
  offerLineAmount: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 14,
    color: Colors.light.darkGrey,
  },
  priceDetailsButton: {
    paddingHorizontal: 34,
    paddingVertical: 10,
    // marginVertical: 4,
  },
  priceDetailsText: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 14,
    color: Colors.light.lightGreen,
  },
  checkoutContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 34,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.lightGrey,
    marginTop: 4,
  },
  storeClosedNotice: {
    paddingHorizontal: 34,
    paddingTop: 8,
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
    lineHeight: 18,
    color: "#C2410C",
  },
  amountContainer: {
    flex: 1,
    marginRight: 16,
  },
  checkoutButton: {
    marginTop: 0,
    flex: 1,
    maxHeight:40
  },
  priceDetailsContainer: {
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.light.mediumLightGrey + "10",
  },
  totalSavingsContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.mediumLightGrey + "20",
    marginTop: 8,
  },
  clearCartButton: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    backgroundColor: Colors.light.lightRed + "15",
    borderRadius: 8,
    marginRight: 20,
    //marginLeft: 12,
  },
  clearCartText: {
    color: Colors.light.lightRed,
    fontSize: 14,
    fontFamily: "Raleway_600SemiBold",
  },
});
