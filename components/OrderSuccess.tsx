import { StyleSheet, Text, View } from "react-native";
import React, { useEffect } from "react";
import { RootState } from "@/types/global";
import { useDispatch, useSelector } from "react-redux";
import LottieSuccess from "@/app/(private)/(address)/LottieSuccess";
import { setOrderSuccessView } from "@/redux/features/cartSlice";

const OrderSuccess = () => {
  const orderSuccessView = useSelector(
    (state: RootState) => state.cart.orderSuccessView || false
  );
  console.log("order sucess7654567890");
  const dispatch = useDispatch();

  useEffect(() => {
    let timeoutId;

    if (orderSuccessView) {
      timeoutId = setTimeout(() => {
        dispatch(setOrderSuccessView(false));
      }, 2000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId); // Clear the timeout on cleanup
      }
    };
  }, [orderSuccessView]);

  if (orderSuccessView) return <LottieSuccess />;
  return null;
};

export default OrderSuccess;

const styles = StyleSheet.create({});
