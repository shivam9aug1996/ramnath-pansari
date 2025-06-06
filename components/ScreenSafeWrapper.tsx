import GoToCart from "@/app/(private)/(category)/ProductList/GoToCart";
import { Colors } from "@/constants/Colors";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import { RootState } from "@/types/global";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useRouter } from "expo-router";
import React, { memo, ReactNode } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import CartIcon from "./CartIcon";
import HeaderBackButton from "./HeaderBackButton";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import WebView from "react-native-webview";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/app/toastconfig";
import DeferredFadeIn from "./DeferredFadeIn";
import DeliveryNotificationBanner from "./DeliveryNotificationBanner";

interface ScreenSafeWrapperProps {
  children: ReactNode;
  showBackButton?: boolean;
  title?: string | undefined;
  useKeyboardAvoidingView?: boolean;
  showCartIcon?: boolean;
  showSearchIcon?: boolean;
}

const ScreenSafeWrapper: React.FC<ScreenSafeWrapperProps> = ({
  children,
  showBackButton = true,
  title = "",
  useKeyboardAvoidingView = false,
  showCartIcon = false,
  showSearchIcon = false,
  wrapperStyle = {},
  headerStyle = {},
  headerVisible,
  cartItems = undefined,
}) => {
  console.log("uytrfghjk", showCartIcon);
  const WrapperComponent = useKeyboardAvoidingView
    ? KeyboardAvoidingView
    : View;
  //const router = useRouter();
  const userId = useSelector((state: RootState) => state.auth?.userData?._id);

  const animatedHeaderStyle = useAnimatedStyle(() => {
    if (!headerVisible) return {};

    return {
      transform: [
        {
          translateY: withTiming(headerVisible.value === 0 ? 0 : 50, {
            duration: 700,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
        },
      ],
    };
  });
  console.log("9876trdfghj", cartItems);
  return (
    <>
      <SafeAreaView style={[styles.container, wrapperStyle]}>
       
        <WrapperComponent
          style={{ flex: 1 }}
          behavior={
            Platform.OS === "ios" && useKeyboardAvoidingView
              ? "padding"
              : "height"
          }
        >
         <DeferredFadeIn delay={100}>
         <ThemedView
            style={[
              {
                flexDirection: "row",
                alignItems: "center",
                position: "relative",
                minHeight: showBackButton || title ? 42 : 0,
              },
              headerStyle,
            ]}
          >
            {showBackButton && <HeaderBackButton />}
            {title && (
              <Animated.View
                style={[
                  {
                    position: "absolute",
                    alignItems: "center",
                    alignSelf: "center",
                    paddingHorizontal: 10,
                    left: "25%",
                    right: "25%",
                  },
                  animatedHeaderStyle,
                ]}
              >
                <ThemedText type="screenHeader">{title}</ThemedText>
              </Animated.View>
            )}
            {showSearchIcon && (
              <TouchableOpacity
                onPress={() => {
                  router.push("/(search)/search");
                  // router.push("/(private)/(tabs)/search");
                }}
                style={{
                  position: "absolute",
                  right: 50,
                  alignItems: "center",
                  // zIndex: -1,
                }}
              >
                <Ionicons name={"search"} size={25} color={"#777777"} />
              </TouchableOpacity>
            )}
            {cartItems !== undefined && cartItems !== 0 ? (
              <Animated.View
                style={[
                  {
                    position: "absolute",
                    right: 0,
                    alignItems: "center",
                    padding: 10,
                  },
                  animatedHeaderStyle,
                ]}
              >
                <ThemedText type="screenHeader">{`${cartItems} items`}</ThemedText>
              </Animated.View>
            ) : null}
            {showCartIcon && <CartIcon />}
          </ThemedView>
         </DeferredFadeIn>
          
          {children}
        </WrapperComponent>
        
      </SafeAreaView>
      {/* <DeliveryNotificationBanner  onClose={() => {}}  /> */}
      
      {/* <GoToCart /> */}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 20,
    paddingTop: Platform.OS == "android" ? 20 : 10,
    position: "relative",
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "400%",
  },
 
});

export default memo(ScreenSafeWrapper);
