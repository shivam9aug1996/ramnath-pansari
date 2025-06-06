import { Platform, StyleSheet, Text, View } from "react-native";
import React, { lazy, Suspense, useMemo } from "react";
import Cart from "@/components/cart/Cart";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

const cart = () => {
  let tabBarHeight = useBottomTabBarHeight();
  // console.log("kjhgfghjk", tabBarHeight);
  // const paddingBottomValue = useMemo(() => {
  //   if (Platform.OS === "android") {
  //     return tabBarHeight === 0 ? tabBarHeight + 45 : tabBarHeight - 20;
  //   } else {
  //     return tabBarHeight === 0 ? tabBarHeight + 10 : tabBarHeight - 60;
  //   }
  // }, [tabBarHeight]);
  // console.log(paddingBottomValue);
  return <Cart tabBarHeight={tabBarHeight} paddingBottomValue={0} />;
};

export default cart;

const styles = StyleSheet.create({});
