import {
  Platform,
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
} from "react-native";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Colors } from "@/constants/Colors";
import { ThemedView } from "../ThemedView";
import { ThemedText } from "../ThemedText";
import { formatNumber, showToast } from "@/utils/utils";
import { useDispatch } from "react-redux";
import { router } from "expo-router";
import {
  calculateTotalAmount,
  calculateTotalAmountMrp,
  findCartChanges,
  findMaxQuantityChanges,
} from "./utils";
import {
  getDeliveryFee,
  getPayableTotalFromItems,
} from "@/utils/deliveryFee";
import {
  cartApi,
  setIsCartOperationProcessing,
  setIsClearCartLoading,
  setNeedToSyncWithBackend,
  useClearCartMutation,
  useFetchCartQuery,
  useLazyBulkUpdateCartQuery,
  useLazyFetchCartQuery,
  useLazyUpdateProductsAsPerCartQuery,
  useSyncCartMutation,
} from "@/redux/features/cartSlice";

import { useLazyFetchAddressQuery } from "@/redux/features/addressSlice";
import { setCheckoutFlow } from "@/redux/features/orderSlice";
import { calculateSavingsAndFreebies } from "@/app/(private)/(orderDetail)/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import Button from "../Button";
import { useRenderTimer } from "@/hooks/useRenderTimer";
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { applyPostCheckoutCartUpdate } from "@/utils/applyPostCheckoutCartUpdate";
import { removeHeldProductsFromCart } from "@/utils/removeHeldProductsFromCart";
import { useCartFooterInsetActions } from "@/contexts/DeliveryFloatContext";

const Continue = ({ tabBarHeight, isCartProcessing, userId }) => {
  useRenderTimer(`Continue`);
  const {
    setCartFooterInset,
    publishCartFooterInsetEstimate,
    setCartFooterInsetMeasured,
  } = useCartFooterInsetActions();
  const isCartOperationProcessing = useSelector(
    (state: RootState) => state?.cart?.isCartOperationProcessing
  );
  const { data: cartData } = useFetchCartQuery({ userId }, { skip: !userId });
  const isClearCartLoading = useSelector(
    (state: RootState) => state.cart.isClearCartLoading
  );

  const [fetchCartData, { isLoading: isCartLoading }] = useLazyFetchCartQuery();
  const [fetchAddress, { isFetching: fetchingAddressLoading }] =
    useLazyFetchAddressQuery();
  const [bulkUpdateCart] = useLazyBulkUpdateCartQuery();
  const [updateProductsAsPerCart] = useLazyUpdateProductsAsPerCartQuery();
  const [syncCart, { isLoading: isSyncCartLoading }] = useSyncCartMutation();
  const [clearCart] = useClearCartMutation();
  const needToSyncWithBackend = useSelector(
    (state: RootState) => state?.cart?.needToSyncWithBackend
  );
  // const navigation = useNavigation();

  const [isDisabled, setIsDisabled] = useState(false);
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  const subtotal = useMemo(
    () => calculateTotalAmount(cartData?.cart?.items),
    [cartData?.cart?.items],
  );

  const deliveryFee = useMemo(() => getDeliveryFee(subtotal), [subtotal]);

  const payableTotal = useMemo(
    () => getPayableTotalFromItems(cartData?.cart?.items),
    [cartData?.cart?.items],
  );

  const cartItems = cartData?.cart?.items?.length || 0;

  const dispatch = useDispatch();

  // useEffect(() => {
  //   latestCartDataRef.current = cartData;
  // }, [cartData?.cart?.items]);

  // console.log(pathname);
  //   useFocusEffect(
  //     // Callback should be wrapped in `React.useCallback` to avoid running the effect too often.
  //     useCallback(() => {
  //       // Invoked whenever the route is focused.
  // console.log("needToSyncWithBackend",needToSyncWithBackend)
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
  //           console.log("payload",payload)
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
  //         console.log('This route is now unfocused.');
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
  //           console.log("payload",payload)
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

  const cartItemsList = cartData?.cart?.items || [];

  const { freebieValue, freebies } = useMemo(() => {
    return calculateSavingsAndFreebies(cartItemsList);
  }, [cartItemsList]);

  const mrpTotal = useMemo(
    () => calculateTotalAmountMrp(cartItemsList),
    [cartItemsList],
  );

  const productDiscount = mrpTotal - subtotal;

  useLayoutEffect(() => {
    if (!cartItems) {
      setCartFooterInset?.(0);
      return;
    }
    publishCartFooterInsetEstimate?.();
  }, [cartItems, publishCartFooterInsetEstimate, setCartFooterInset]);

  useEffect(() => {
    return () => {
      setCartFooterInset?.(0);
    };
  }, [setCartFooterInset]);

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
                    console.log("needToSync654345678",needToSync)
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
                <ThemedView style={styles.totalContainer}>
                  <ThemedText style={styles.totalLabel}>
                    {"Total before discount"}
                  </ThemedText>
                  <ThemedText style={styles.baselineAmount}>{`₹ ${formatNumber(
                    mrpTotal
                  )}`}</ThemedText>
                </ThemedView>

                {productDiscount > 0 && (
                  <ThemedView style={styles.totalContainer}>
                    <ThemedText style={styles.totalLabel}>
                      {"Product Discount"}
                    </ThemedText>
                    <ThemedText style={styles.savingsAmount}>{`- ₹ ${formatNumber(
                      productDiscount.toFixed(2)
                    )}`}</ThemedText>
                  </ThemedView>
                )}

                {freebieValue > 0 && (
                  <ThemedView
                    style={[styles.totalContainer, styles.freebieSection]}
                  >
                    <View style={styles.freebiesContainer}>
                      <ThemedText style={styles.totalLabel}>
                        {"Includes Freebies"}
                      </ThemedText>
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
                                <Text style={styles.quantityText}>
                                  {freebie.quantity}x
                                </Text>
                              </View>
                              <Text
                                style={styles.freebieName}
                                numberOfLines={1}
                              >
                                {freebie.name}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={styles.freebiePriceColumn}>
                      <ThemedText style={styles.freebieZeroAmount}>
                        ₹ 0
                      </ThemedText>
                      <ThemedText style={styles.freebieWorthHint}>
                        {`worth ₹${formatNumber(freebieValue)}`}
                      </ThemedText>
                    </View>
                  </ThemedView>
                )}

                <ThemedView
                  style={[styles.totalContainer, styles.subtotalContainer]}
                >
                  <ThemedText style={styles.subtotalLabel}>
                    {"Item Total"}
                  </ThemedText>
                  <ThemedText style={styles.subtotalAmount}>{`₹ ${formatNumber(
                    subtotal
                  )}`}</ThemedText>
                </ThemedView>

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
                  dispatch(setIsCartOperationProcessing(true))
                  dispatch(setCheckoutFlow(true));
                  setIsDisabled(true);
                  const preSyncCart = cartData;
                  console.log("[cart-sync] checkout:start", {
                    itemCount: preSyncCart?.cart?.items?.length ?? 0,
                    items: (preSyncCart?.cart?.items ?? []).map((item: any) => ({
                      productId: item?.productDetails?._id ?? item?.productId,
                      quantity: item?.quantity,
                      maxQuantity: item?.productDetails?.maxQuantity ?? null,
                    })),
                  });
                  let payload = cartData?.cart?.items?.map((item: any) => {
                    return {
                      productId: item?.productDetails?._id,
                      quantity: item?.quantity,
                    };
                  });
                  payload = payload.filter(
                    (item: any) =>
                      item?.productId !== "676da9f75763ded56d43032d"
                  );
                  console.log("payload", payload);
                 
                 
                 
                 let data112;
                 try {
                   data112 = await updateProductsAsPerCart({
                     body: {
                       items: payload,
                     },
                     params: { userId },
                   })?.unwrap();
                 } catch (error: any) {
                   const status = error?.status;
                   const errorData = error?.data ?? {};
                   const heldProducts = errorData?.heldProducts;
                   console.log("[product-lock] checkout:error", {
                     userId,
                     status,
                     errorData,
                     heldProducts,
                     rawError: error,
                   });
                   if (Array.isArray(heldProducts) && heldProducts.length > 0) {
                     const heldIds = heldProducts.map(
                       (item: { productId: string }) => String(item.productId),
                     );
                     const removePayload = heldIds.map((productId: string) => ({
                       productId,
                       quantity: 0,
                     }));
                     console.log("[product-lock] checkout:remove-held", {
                       userId,
                       heldIds,
                       removePayload,
                     });
                     try {
                       await removeHeldProductsFromCart({
                         dispatch,
                         userId,
                         heldProductIds: heldIds,
                         currentCartItems: preSyncCart?.cart?.items ?? [],
                         bulkUpdateCart,
                         fetchCartData,
                       });
                       console.log("[product-lock] checkout:remove-held:done", {
                         userId,
                       });
                     } catch (removeError: any) {
                       console.log("[product-lock] checkout:remove-held:failed", {
                         userId,
                         heldIds,
                         removeError: removeError?.data ?? removeError,
                       });
                       showToast({
                         type: "error",
                         text2:
                           "Item is on hold but could not be removed from cart. Please refresh your cart.",
                       });
                     }
                     const heldName =
                       preSyncCart?.cart?.items?.find(
                         (item: any) =>
                           String(
                             item?.productDetails?._id ?? item?.productId,
                           ) === heldIds[0],
                       )?.productDetails?.name ?? "This item";
                     showToast({
                       type: "info",
                       text2:
                         heldIds.length === 1
                           ? `${heldName} is being fulfilled for another order and was removed from your cart.`
                           : `${heldName} and other items are on hold and were removed from your cart.`,
                     });
                   } else {
                     const fallbackMessage =
                       errorData?.message ||
                       errorData?.error ||
                       "Unable to continue checkout. Please try again.";
                     console.log("[product-lock] checkout:generic-error", {
                       userId,
                       status,
                       fallbackMessage,
                     });
                     showToast({
                       type: "error",
                       text2: fallbackMessage,
                     });
                   }
                     dispatch(setCheckoutFlow(false));
                     setIsDisabled(false);
                     dispatch(setIsCartOperationProcessing(false));
                     return;
                 }
                  console.log("[cart-sync] checkout:sync response", {
                    data: (data112?.data ?? []).map((item: any) => ({
                      productId: item?.productId,
                      status: item?.status,
                      oldMaxQuantity: item?.oldMaxQuantity ?? null,
                      newMaxQuantity: item?.newMaxQuantity ?? null,
                      oldIsOutOfStock: item?.oldIsOutOfStock ?? null,
                      newIsOutOfStock: item?.newIsOutOfStock ?? null,
                      oldPrice: item?.oldDiscountedPrice ?? null,
                      newPrice: item?.newDiscountedPrice ?? null,
                      error: item?.error ?? null,
                    })),
                  });
                  let newPayload = data112?.data.filter(
                    (item: any) =>
                      item?.productId !== "676da9f75763ded56d43032d"
                  );
                  const bulkResult = await bulkUpdateCart({
                    body: {
                      items: payload,
                    },
                    params: { userId },
                  })?.unwrap();
                  console.log("[cart-sync] checkout:bulk result", {
                    failedItems: bulkResult?.failedItems ?? [],
                  });
                  
                 
                  //await SecureStore.setItemAsync(`cartData-${userId}-needToSync`, "false")
                  await AsyncStorage.setItem(`cartData-${userId}-needToSync`, "false")


                  // await syncCart({
                  //   body: {},
                  //   params: { userId: userId },
                  // })?.unwrap();
                  const newCartData = await fetchCartData(
                    { userId },
                    false
                  )?.unwrap();

                  await applyPostCheckoutCartUpdate(
                    dispatch,
                    userId,
                    newCartData,
                    data112?.data,
                  );

                 // dispatch(setNeedToSyncWithBackend({ status: false }));
                  //await SecureStore.deleteItemAsync(`cartData-${userId}`)

                  let changes = findCartChanges(preSyncCart, newCartData);
                  let quantityChanges = findMaxQuantityChanges(preSyncCart, newCartData);
                  console.log("[cart-sync] checkout:comparison", {
                    priceChanges: changes?.priceChanges ?? [],
                    removedItems: changes?.removedItems ?? [],
                    maxQuantityChanges: quantityChanges?.maxQuantityChanges ?? [],
                    itemsToRemove: quantityChanges?.itemsToRemove ?? [],
                    postSyncItems: (newCartData?.cart?.items ?? []).map((item: any) => ({
                      productId: item?.productDetails?._id ?? item?.productId,
                      quantity: item?.quantity,
                      maxQuantity: item?.productDetails?.maxQuantity ?? null,
                    })),
                  });
                 // console.log("quantityChanges8765456789",quantityChanges)
                  if (
                    changes?.priceChanges.length > 0 ||
                    changes?.removedItems.length > 0
                  ) {
                    const removed = changes?.removedItems ?? [];
                    const cartNowEmpty =
                      (newCartData?.cart?.items?.length ?? 0) === 0;
                    console.log("[cart-sync] checkout:blocked — price/removal changes", {
                      removedItems: removed,
                      priceChanges: changes?.priceChanges ?? [],
                      cartNowEmpty,
                    });
                    showToast({
                      type: "info",
                      text2:
                        removed.length > 0
                          ? cartNowEmpty
                            ? `${removed[0].productName} is no longer available and was removed from your cart.`
                            : `${removed[0].productName} was removed from your cart. Please review before checkout.`
                          : "Product details are changed. Please review before checkout.",
                    });
                    setIsDisabled(false);
                    dispatch(setIsCartOperationProcessing(false))
                  }
                   else if(quantityChanges?.maxQuantityChanges.length > 0){
                    const limitChange = quantityChanges.maxQuantityChanges[0];
                    console.log("[cart-sync] checkout:blocked — limit change", limitChange);
                    showToast({
                      type: "info",
                      text2:
                        `Purchase limit updated (max ${limitChange.newMaxQuantity} units). Please review your cart.`,
                    });
                    setIsDisabled(false);
                    dispatch(setIsCartOperationProcessing(false))
                  }
                  else if(quantityChanges?.itemsToRemove.length > 0){
                    console.log("[cart-sync] checkout:blocked — items to remove", quantityChanges.itemsToRemove);
                    showToast({
                      type: "info",
                      text2:
                        "Product is removed from cart. Please review before checkout.",
                    });
                    setIsDisabled(false);
                    dispatch(setIsCartOperationProcessing(false))
                  }
                  else {
                    console.log("[cart-sync] checkout:proceed → address list");
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
                title={isCartProcessing ? "Processing..." : `Checkout`}
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
    fontFamily: "Raleway_500Medium",
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
  freebiesContainer: {
    flex: 1,
    marginRight: 16,
  },
  freebiesList: {
    marginTop: 4,
    gap: 6,
  },
  freebieItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  freebieImage: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: Colors.light.lightGrey + "20",
  },
  freebieDetails: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quantityBadge: {
    backgroundColor: Colors.light.lightGreen + "20",
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
  freebieSection: {
    paddingVertical: 12,
    backgroundColor: Colors.light.background + "50",
  },
  freebiePriceColumn: {
    alignItems: "flex-end",
    gap: 2,
  },
  freebieZeroAmount: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 16,
    color: Colors.light.lightGreen,
  },
  freebieWorthHint: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 11,
    color: Colors.light.mediumGrey,
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
