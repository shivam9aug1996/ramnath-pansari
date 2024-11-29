import { StyleSheet } from "react-native";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Stack } from "expo-router";
import GoToCart from "../../(category)/ProductList/GoToCart";

const HomeNavigator = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="home" options={{ headerShown: false }} />

        {/* <Stack.Screen
          name="category/[category]"
          options={{ headerShown: true }}
        /> */}
        {/* <Stack.Screen name="home1" options={{ headerShown: false }} /> */}
      </Stack>
    </>
  );
};

export default HomeNavigator;

const styles = StyleSheet.create({});
