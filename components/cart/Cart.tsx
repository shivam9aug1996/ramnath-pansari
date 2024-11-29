import React, { memo, useMemo } from "react";
import { View, StyleSheet, Platform, Text } from "react-native";
import ScreenSafeWrapper from "../ScreenSafeWrapper";

import { useDispatch, useSelector } from "react-redux";
import { CartItemProps, RootState } from "@/types/global";
import { cartApi, useFetchCartQuery } from "@/redux/features/cartSlice";
import { Colors } from "@/constants/Colors";
import Button from "../Button";
import CartItem from "./CartItem";

import { ThemedView } from "../ThemedView";
import { ThemedText } from "../ThemedText";
import { calculateTotalAmount } from "./utils";
import NotFound from "@/app/(private)/(result)/NotFound";
import { router } from "expo-router";
import CartPlaceholder from "./CartPlaceholder";
import TryAgain from "@/app/(private)/(category)/CategoryList/TryAgain";
import { setCheckoutFlow } from "@/redux/features/orderSlice";
import { FlashList } from "@shopify/flash-list";

interface CartProps {
  tabBarHeight?: number; // Optional prop with a default value
}

const Cart = ({ tabBarHeight = 0 }: CartProps) => {
  const userId = useSelector((state: RootState) => state.auth?.userData?._id);
  const cartButtonProductId = useSelector(
    (state: RootState) => state.cart.cartButtonProductId
  );
  const {
    data: cartData,
    isLoading,
    isSuccess,
    error,
    refetch,
  } = useFetchCartQuery({ userId }, { skip: !userId });

  const cartItems = cartData?.cart?.items?.length || 0;
  const dispatch = useDispatch();
  const totalAmount = useMemo(() => {
    return calculateTotalAmount(cartData?.cart?.items)?.toFixed(2);
  }, [cartData?.cart?.items]);

  const cartItemIndex = cartData?.cart?.items?.findIndex((item, index) => {
    return cartButtonProductId?.includes(item?.productDetails?._id);
  });
  const isCartProcessing = cartButtonProductId.length !== 0;

  const renderItem = ({ item, index }: CartItemProps) => {
    return <CartItem key={item?.productDetails?._id || index} item={item} />;
  };
  const cRefetch = () => {
    refetch();
    dispatch(cartApi.util.resetApiState());
  };

  return (
    <ScreenSafeWrapper>
      <ThemedView style={styles.headerContainer}>
        <ThemedText style={styles.headerTitle}>{"My Bag"}</ThemedText>
        {isSuccess && (
          <ThemedText style={styles.headerSubtitle}>
            {`${cartItems} items`}
          </ThemedText>
        )}
      </ThemedView>
      {isLoading ? (
        <CartPlaceholder />
      ) : error ? (
        <TryAgain refetch={cRefetch} />
      ) : cartItems == 0 ? (
        <NotFound
          title={"It’s lonely here"}
          subtitle={"Start and add more items to the bag."}
          style={{ flex: 0.5 }}
        />
      ) : (
        <>
          <View style={{ marginTop: 12 }} />

          <FlashList
            ListHeaderComponent={
              cartItemIndex == -1 && isCartProcessing ? (
                <CartPlaceholder
                  wrapperStyle={{ paddingHorizontal: 0, paddingTop: 0 }}
                  count={1}
                />
              ) : null
            }
            extraData={cartData?.cart?.items}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            data={cartData?.cart?.items}
            renderItem={renderItem}
            keyExtractor={(item, index) => item?.productDetails?._id || index}
            estimatedItemSize={101}
          />
          {cartItems ? (
            <>
              <View style={styles.divider} />
              <ThemedView style={styles.totalContainer}>
                <ThemedText style={styles.totalLabel}>{"Total"}</ThemedText>
                <ThemedText
                  style={styles.totalAmount}
                >{`₹ ${totalAmount}`}</ThemedText>
              </ThemedView>

              <Button
                isLoading={isCartProcessing}
                disabled={isCartProcessing}
                onPress={() => {
                  dispatch(setCheckoutFlow(true));
                  router.push({
                    pathname: "/(address)/addressList",
                  });
                }}
                title={
                  isCartProcessing
                    ? "Processing your cart..."
                    : `Continue To Checkout`
                }
              />
            </>
          ) : null}

          <View
            style={{
              paddingBottom:
                Platform.OS == "android"
                  ? tabBarHeight == 0
                    ? tabBarHeight + 45
                    : tabBarHeight - 20
                  : tabBarHeight == 0
                  ? tabBarHeight + 10
                  : tabBarHeight - 60,
            }}
          />
        </>
      )}
    </ScreenSafeWrapper>
  );
};

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
});

export default memo(Cart);
