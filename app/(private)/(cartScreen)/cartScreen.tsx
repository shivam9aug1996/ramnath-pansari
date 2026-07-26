import { StyleSheet, Text, View } from "react-native";
import React from "react";
import AppHead from "@/components/AppHead";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import Cart from "@/components/cart/Cart";
import DelayedVisibilityWrapper from "@/components/DelayedVisibilityWrapper";

const cartScreen = () => {
  return (
    <>
      <AppHead title="Cart" />
      <Cart />
    </>
  );
};

export default cartScreen;

const styles = StyleSheet.create({});
