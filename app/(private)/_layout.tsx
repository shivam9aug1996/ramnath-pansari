import { StyleSheet } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import GoToCart from "./(category)/ProductList/GoToCart";
export { ErrorBoundary } from "expo-router";

const MainNavigator = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(search)/search"
          options={{ headerShown: false, animation: "none" }}
        />
        <Stack.Screen name="(category)/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="(cartScreen)/cartScreen"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(result)/[query]"
          options={{
            headerShown: false,
            animation: "none",
          }}
        />
        <Stack.Screen
          name="(address)/addressList"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(address)/addAddress"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(address)/mapSelect"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(address)/locationSearchScreen"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(profile)/profile"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(order)/order"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(productDetail)/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(orderDetail)/[id]"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
};

export default MainNavigator;

const styles = StyleSheet.create({});
