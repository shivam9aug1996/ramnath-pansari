import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { fonts } from "@/constants/Fonts";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { useFetchCartQuery } from "@/redux/features/cartSlice";

export default function TabLayout() {
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const {
    data: cartData,
    isFetching: isCartFetching,
    isError: isCartError,
    isLoading: isCartLoading,
  } = useFetchCartQuery(
    {
      userId,
    },
    {
      skip: !userId,
    }
  );

  const cartItems = cartData?.cart?.items?.length || 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { height: 80, paddingBottom: 25 },
      }}
      sceneContainerStyle={{ height: 70 }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => {
            return focused ? (
              <ThemedView style={styles.outerCircle}>
                <ThemedView style={styles.innerCircle}>
                  <TabBarIcon name={"home"} color={Colors.light.white} />
                </ThemedView>
              </ThemedView>
            ) : (
              <TabBarIcon name={"home"} color={Colors.light.mediumGrey} />
            );
          },
          tabBarLabel: ({ focused }) => {
            return focused ? (
              <ThemedText
                lightColor="#777777"
                style={{ ...fonts.defaultSemiBold, fontSize: 14 }}
              >
                {"Home"}
              </ThemedText>
            ) : null;
          },
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, focused }) => {
            return focused ? (
              <ThemedView style={styles.outerCircle}>
                <ThemedView style={styles.innerCircle}>
                  {cartItems > 0 && (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        backgroundColor: "#EC534A",
                        borderRadius: 3,
                        position: "absolute",
                        right: 18,
                        top: 18,
                      }}
                    />
                  )}
                  <TabBarIcon name={"bag-handle"} color={Colors.light.white} />
                </ThemedView>
              </ThemedView>
            ) : (
              <View>
                {cartItems > 0 && (
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      backgroundColor: "#EC534A",
                      borderRadius: 3,
                      position: "absolute",
                      top: 0,
                      right: 0,
                    }}
                  />
                )}
                <TabBarIcon
                  name={"bag-handle"}
                  color={Colors.light.mediumGrey}
                />
              </View>
            );
          },
          tabBarLabel: ({ focused }) => {
            return focused ? (
              <ThemedText
                lightColor="#777777"
                style={{ ...fonts.defaultSemiBold, fontSize: 14 }}
              >
                {"Bag"}
              </ThemedText>
            ) : null;
          },
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, focused }) => {
            return focused ? (
              <ThemedView style={styles.outerCircle}>
                <ThemedView style={styles.innerCircle}>
                  <TabBarIcon name={"person"} color={Colors.light.white} />
                </ThemedView>
              </ThemedView>
            ) : (
              <TabBarIcon name={"person"} color={Colors.light.mediumGrey} />
            );
          },
          tabBarLabel: ({ focused }) => {
            return focused ? (
              <ThemedText
                lightColor="#777777"
                style={{ ...fonts.defaultSemiBold, fontSize: 14 }}
              >
                {"Profile"}
              </ThemedText>
            ) : null;
          },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  defaultTabContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  defaultTab: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    color: "black",
    marginTop: 5,
  },
  outerCircle: {
    width: 82,
    height: 82,
    borderRadius: 42,
    bottom: 20,
  },
  innerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.gradientGreen_2,
    alignSelf: "center",
    top: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});