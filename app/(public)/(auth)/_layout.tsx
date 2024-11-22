import React from "react";
import { Stack } from "expo-router";
import { Colors } from "@/constants/Colors";
export { ErrorBoundary } from "expo-router";

const AuthLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: Colors.light.background,
        },
        headerTintColor: Colors.light.background,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="verify" />
      <Stack.Screen
        name="name"
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="terms" />
    </Stack>
  );
};

export default AuthLayout;
