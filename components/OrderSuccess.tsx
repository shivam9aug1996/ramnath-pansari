import { StyleSheet } from "react-native";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import LottieSuccess from "@/app/(private)/(address)/LottieSuccess";
import { setOrderSuccessView } from "@/redux/features/cartSlice";
import OrderLottie from "./OrderLottie";

const OrderSuccess = () => {
  const orderSuccessView = useSelector(
    (state: RootState) => state.cart.orderSuccessView || false
  );
  const dispatch = useDispatch();

  // useEffect(()=>{
  //   if(orderSuccessView){
  //   let timer = setTimeout(()=>{
  //       dispatch(setOrderSuccessView(false));
  //     },2000)
  //     return ()=>clearTimeout(timer);
  //   }

  // },[orderSuccessView])

  // if (!orderSuccessView) return null;

  return (
    <OrderLottie  />
  );
};

export default OrderSuccess;

const styles = StyleSheet.create({});