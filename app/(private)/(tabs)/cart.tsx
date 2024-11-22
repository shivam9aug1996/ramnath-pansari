import { StyleSheet, Text, View } from "react-native";
import React from "react";
import Cart from "@/components/cart/Cart";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

const cart = () => {
  let tabBarHeight = useBottomTabBarHeight();
  return <Cart tabBarHeight={tabBarHeight} />;
};

export default cart;

const styles = StyleSheet.create({});
