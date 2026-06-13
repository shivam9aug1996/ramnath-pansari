import { StyleSheet, View } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import ActiveDeliveryFloat from "@/components/ActiveDeliveryFloat";
import { DeliveryFloatProvider } from "@/contexts/DeliveryFloatContext";
export { ErrorBoundary } from "expo-router";

const MainNavigator = () => {
  return (
    <DeliveryFloatProvider>
    <View style={styles.root}>
    <Stack>
      
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(search)/search"
        options={{
          headerShown: false,
          keyboardHandlingEnabled: true,
          animation: "ios_from_right",
          animationDuration: 0,
          // presentation: "card",
        }}
      />
      <Stack.Screen
        name="(category)/[id]"
        options={{
          headerShown: false,
          animation: "ios_from_right",
          animationDuration: 0,
        }}
        

        
      />
      <Stack.Screen
        name="(cartScreen)/cartScreen"
        options={{
          headerShown: false,
          // animation: "ios_from_right",
          // animationDuration: 0,
          animation: "ios_from_right",
          animationDuration: 0,
         // presentation: "modal",
        }}
      />
      <Stack.Screen
        name="(result)/[query]"
        options={{
          headerShown: false,
          keyboardHandlingEnabled: true,
          animation: "ios_from_right",
          animationDuration: 0,
          //animation: "none",
        }}
      />
      <Stack.Screen
        name="(address)/addressList"
        options={{
          headerShown: false,
          animation: "ios_from_right",
          animationDuration: 0,
        }}
      />
      <Stack.Screen
        name="(address)/addAddress"
        options={{
          headerShown: false,
          animation: "ios_from_right",
          animationDuration: 0,
        }}
      />
      <Stack.Screen
        name="(address)/mapSelect"
        options={{
          headerShown: false,
          animation: "ios_from_right",
          animationDuration: 0,
        }}
      />
      <Stack.Screen
        name="(address)/WebMap"
        options={{
          headerShown: false,
          animation: "ios_from_right",
          animationDuration: 0,
        }}
      />
      <Stack.Screen
        name="(address)/locationSearchScreen"
        options={{
          headerShown: false,
          animation: "ios_from_right",
          animationDuration: 0,
        }}
      />
      <Stack.Screen
        name="(profile)/profile"
        options={{
          headerShown: false,
          animation: "ios_from_right",
          animationDuration: 0,
        }}
      />
      <Stack.Screen
        name="(order)/order"
        options={{
          headerShown: false,
          animation: "ios_from_right",
          animationDuration: 0,
        }}
      />
      <Stack.Screen
        name="(productDetail)/[id]"
        options={{
          headerShown: false,
          animation: "ios_from_right",
          animationDuration: 0,
        }}
      />
      <Stack.Screen
        name="(orderDetail)/[id]"
        options={{
          headerShown: false,
          animation: "ios_from_right",
          animationDuration: 0,
        }}
      />
      <Stack.Screen
        name={`khata/[id]`}
        options={{
          headerShown: false,
          animation: "ios_from_right",
          animationDuration: 0,
        }}
      />
    </Stack>
    <ActiveDeliveryFloat />
    </View>
    </DeliveryFloatProvider>
  );
};

export default MainNavigator;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
