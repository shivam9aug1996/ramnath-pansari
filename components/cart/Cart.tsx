import React, {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { View, StyleSheet, Platform, Text, FlatList } from "react-native";
import ScreenSafeWrapper from "../ScreenSafeWrapper";

import { useDispatch, useSelector } from "react-redux";
import { CartItemProps, RootState } from "@/types/global";
import {
  cartApi,
  useFetchCartQuery,
  useLazyFetchCartQuery,
  useSyncCartMutation,
} from "@/redux/features/cartSlice";
import { Colors } from "@/constants/Colors";
// import Button from "../Button";
import CartItem from "./CartItem";

import { ThemedView } from "../ThemedView";
import { ThemedText } from "../ThemedText";
import { calculateTotalAmount, findCartChanges } from "./utils";
// import NotFound from "@/app/(private)/(result)/NotFound";
import { router } from "expo-router";
import CartPlaceholder from "./CartPlaceholder";
// import TryAgain from "@/app/(private)/(category)/CategoryList/TryAgain";
import { setCheckoutFlow } from "@/redux/features/orderSlice";
import { FlashList } from "@shopify/flash-list";
import { useLazyFetchAddressQuery } from "@/redux/features/addressSlice";
import CustomSuspense from "../CustomSuspense";
import { formatNumber, showToast } from "@/utils/utils";
import CartList from "./CartList";
import GoToCart from "@/app/(private)/(category)/ProductList/GoToCart";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Continue from "./Continue";
// import { Toast } from "toastify-react-native";

const NotFound = lazy(() => import("@/app/(private)/(result)/NotFound"));
const Button = lazy(() => import("../Button"));

const TryAgain = lazy(
  () => import("@/app/(private)/(category)/CategoryList/TryAgain")
);

interface CartProps {
  tabBarHeight?: number; // Optional prop with a default value
}

const Cart = ({ tabBarHeight = 0, paddingBottomValue }: CartProps) => {
  // for (let i = 0; i < 10000; i++) {
  //   console.log("hi");
  // }
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
  // const [syncCart, { isLoading: isSyncCartLoading }] = useSyncCartMutation();
  // const [fetchCartData, { isLoading: isCartLoading }] = useLazyFetchCartQuery();
  console.log("uytresdfghjkl", cartData, isLoading);

  const cartItems = cartData?.cart?.items?.length || 0;
  // const [fetchAddress, { isFetching: fetchingAddressLoading }] =
  //   useLazyFetchAddressQuery();
  const dispatch = useDispatch();
  // const [isDisabled, setIsDisabled] = useState(false);
  const headerVisible = useSharedValue(1);
  // const totalAmount = useMemo(() => {
  //   return calculateTotalAmount(cartData?.cart?.items)?.toFixed(2);
  // }, [cartData?.cart?.items]);

  // const paddingBottomValue = useMemo(() => {
  //   if (Platform.OS === "android") {
  //     return tabBarHeight === 0 ? tabBarHeight + 45 : tabBarHeight - 20;
  //   } else {
  //     return tabBarHeight === 0 ? tabBarHeight + 10 : tabBarHeight - 60;
  //   }
  // }, [tabBarHeight]);

  const cartItemIndex = cartData?.cart?.items?.findIndex((item, index) => {
    return cartButtonProductId?.includes(item?.productDetails?._id);
  });
  const isCartProcessing = cartButtonProductId.length !== 0;

  const cRefetch = () => {
    refetch();
    dispatch(cartApi.util.resetApiState());
  };
  console.log("uytrfghjkjhg", cartItemIndex, isCartProcessing);

  const animatedHeaderStyle1 = useAnimatedStyle(() => {
    const translateY = withTiming(headerVisible.value === 1 ? 0 : -350, {
      duration: 700,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    const height = withTiming(headerVisible.value === 1 ? 180 : 50, {
      duration: 700,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    return { transform: [{ translateY }], height };
  });

  return (
    <>
      <ScreenSafeWrapper
        headerVisible={headerVisible}
        title="My Bag"
        cartItems={cartItems}
      >
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 45,
              left: 0,
              right: 0,
              backgroundColor: Colors.light.background,
              zIndex: 999,
              maxHeight: 90,
            },
            animatedHeaderStyle1,
          ]}
        >
          <>
            <ThemedView style={styles.headerContainer}>
              <ThemedText style={styles.headerTitle}>{"My Bag"}</ThemedText>
              {isSuccess && (
                <ThemedText style={styles.headerSubtitle}>
                  {`${cartItems} items`}
                </ThemedText>
              )}
            </ThemedView>
            <GoToCart isCart={true} />
          </>
        </Animated.View>

        <CustomSuspense>
          {isLoading ? (
            <CartPlaceholder
              wrapperStyle={{ paddingHorizontal: 0, paddingTop: 185 }}
            />
          ) : error ? (
            <Suspense fallback={null}>
              <TryAgain refetch={cRefetch} />
            </Suspense>
          ) : cartItems == 0 && !isCartProcessing ? (
            <Suspense fallback={null}>
              <NotFound
                title={"It’s lonely here"}
                subtitle={"Start and add more items to the bag."}
                style={{ flex: 0.5 }}
              />
            </Suspense>
          ) : (
            <>
              <View style={{ marginTop: 12 }} />

              <CartList
                headerVisible={headerVisible}
                cartData={cartData}
                cartItemIndex={cartItemIndex}
                isCartProcessing={isCartProcessing}
              />

              <Continue
                cartData={cartData}
                headerVisible={headerVisible}
                tabBarHeight={tabBarHeight}
                isCartProcessing={isCartProcessing}
                userId={userId}
              />
            </>
          )}
        </CustomSuspense>
      </ScreenSafeWrapper>
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    // marginTop: 37,
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
