import { Stack } from "expo-router";
import { Colors } from "@/constants/Colors";
import { Platform } from "react-native";

const stackScreenOptions = {
  headerShown: false,
  headerShadowVisible: false,
  headerStyle: {
    backgroundColor: Colors.light.background,
  },
  headerTintColor: Colors.light.background,
  animation: Platform?.OS === "ios" ? "simple_push" : "default",
  animationDuration: 0,
} as const;

const nameScreenOptions = {
  gestureEnabled: false,
} as const;

const AuthLayout = () => {
  return (
    <Stack screenOptions={stackScreenOptions}>
      
      <Stack.Screen name="login" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="name" options={nameScreenOptions} />
      <Stack.Screen name="terms" />
    </Stack>
  );
};

export { ErrorBoundary } from "expo-router";
export default AuthLayout;