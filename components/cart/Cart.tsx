import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import ScreenSafeWrapper from "../ScreenSafeWrapper";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { cartApi, useFetchCartQuery } from "@/redux/features/cartSlice";
import { Colors } from "@/constants/Colors";

import CartPlaceholder from "./CartPlaceholder";

import CartList from "./CartList";
import GoToCart from "@/app/(private)/(category)/ProductList/GoToCart";

import Continue from "./Continue";
import NotFound from "@/app/(private)/(result)/NotFound";
import TryAgain from "@/app/(private)/(category)/CategoryList/TryAgain";
import DeferredFadeIn from "../DeferredFadeIn";
// import { useRenderTimer } from "@/hooks/useRenderTimer";


interface CartProps {
  tabBarHeight?: number;
}

const Cart = ({ tabBarHeight = 0 }: CartProps) => {
  //useRenderTimer(`Cart`);
 // console.log("cart",tabBarHeight);
  const userId = useSelector((state: RootState) => state.auth?.userData?._id);
  const cartButtonProductId = useSelector(
    (state: RootState) => state?.cart?.cartButtonProductId || []
  );
  const {
    data: cartData,
    isLoading,
    error,
    refetch,
  } = useFetchCartQuery({ userId }, { skip: !userId });

  const cartItems = cartData?.cart?.items?.length || 0;

  const dispatch = useDispatch();

  const cartItemIndex = cartData?.cart?.items?.findIndex((item, index) => {
    return cartButtonProductId?.includes(item?.productDetails?._id);
  });
  const isCartProcessing = cartButtonProductId?.length !== 0;

  const cRefetch = () => {
    refetch();
    dispatch(cartApi.util.resetApiState());
  };

  console.log("cartData",JSON.stringify(cartData))

  return (
    <>
      <ScreenSafeWrapper title="My Bag" cartItems={cartItems}>
        <DeferredFadeIn delay={100} style={{ flex: 1 }}>
          {isLoading ? (
            <CartPlaceholder wrapperStyle={{ paddingHorizontal: 0 }} />
          ) : error ? (
            <TryAgain refetch={cRefetch} />
          ) : cartItems == 0 && !isCartProcessing ? (
            <NotFound
              title={"It's lonely here"}
              subtitle={"Start and add more items to the bag."}
              style={{ flex: 0.5 }}
            />
          ) : (
            <>
              <View style={{ marginTop: 12 }} />
              <GoToCart isCart={true} />

              <DeferredFadeIn delay={0}>
                <CartList
                  cartData={cartData}
                  cartItemIndex={cartItemIndex}
                  isCartProcessing={isCartProcessing}
                />
              </DeferredFadeIn>
            </>
          )}
        </DeferredFadeIn>
      </ScreenSafeWrapper>
      <DeferredFadeIn delay={200}>
        <Continue
          cartData={cartData}
          headerVisible={true}
          tabBarHeight={tabBarHeight}
          isCartProcessing={isCartProcessing}
          userId={userId}
        />
      </DeferredFadeIn>
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
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
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default memo(Cart);


