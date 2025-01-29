import { Platform, StyleSheet } from "react-native";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import GoToCart from "./(category)/ProductList/GoToCart";
import { Alert } from "react-native";
import LottieMenWalking from "./(address)/LottieMenWalking";
export { ErrorBoundary } from "expo-router";

const MainNavigator = () => {
  // useEffect(() => {
  //   setTimeout(() => {
  //     Alert.alert("hi");
  //   }, 5000);
  // }, []);
  console.log("kjhtr67890-");
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(search)/search"
        options={{
          headerShown: false,
          keyboardHandlingEnabled: true,
          animation: Platform?.OS === "ios" ? "simple_push" : "default",
          animationDuration: 0,
          //  animation: "none"
        }}
      />
      <Stack.Screen
        name="(category)/[id]"
        options={{
          headerShown: false,
          animation: Platform?.OS === "ios" ? "simple_push" : "default",
          animationDuration: 0,
        }}
      />
      <Stack.Screen
        name="(cartScreen)/cartScreen"
        options={{
          headerShown: false,
          animation: Platform?.OS === "ios" ? "simple_push" : "default",
          animationDuration: 0,
        }}
      />
      <Stack.Screen
        name="(result)/[query]"
        options={{
          headerShown: false,
          keyboardHandlingEnabled: true,
          animation: Platform?.OS === "ios" ? "simple_push" : "default",
          animationDuration: 0,
          //animation: "none",
        }}
      />
      <Stack.Screen
        name="(address)/addressList"
        options={{
          headerShown: false,
          animation: Platform?.OS === "ios" ? "simple_push" : "default",
          animationDuration: 0,
        }}
      />
      <Stack.Screen
        name="(address)/addAddress"
        options={{
          headerShown: false,
          animation: Platform?.OS === "ios" ? "simple_push" : "default",
          animationDuration: 0,
        }}
      />
      <Stack.Screen
        name="(address)/mapSelect"
        options={{
          headerShown: false,
          animation: Platform?.OS === "ios" ? "simple_push" : "default",
          animationDuration: 0,
        }}
      />
      <Stack.Screen
        name="(address)/locationSearchScreen"
        options={{
          headerShown: false,
          animation: Platform?.OS === "ios" ? "simple_push" : "default",
          animationDuration: 0,
        }}
      />
      <Stack.Screen
        name="(profile)/profile"
        options={{
          headerShown: false,
          animation: Platform?.OS === "ios" ? "simple_push" : "default",
          animationDuration: 0,
        }}
      />
      <Stack.Screen
        name="(order)/order"
        options={{
          headerShown: false,
          animation: Platform?.OS === "ios" ? "simple_push" : "default",
          animationDuration: 0,
        }}
      />
      <Stack.Screen
        name="(productDetail)/[id]"
        options={{
          headerShown: false,
          animation: Platform?.OS === "ios" ? "simple_push" : "default",
          animationDuration: 0,
        }}
      />
      <Stack.Screen
        name="(orderDetail)/[id]"
        options={{
          headerShown: false,
          animation: Platform?.OS === "ios" ? "simple_push" : "default",
          animationDuration: 0,
        }}
      />
      <Stack.Screen
        name={`khata/[id]`}
        options={{
          headerShown: false,
          animation: Platform?.OS === "ios" ? "simple_push" : "default",
          animationDuration: 0,
        }}
      />
    </Stack>
  );
};

export default MainNavigator;

const styles = StyleSheet.create({});
