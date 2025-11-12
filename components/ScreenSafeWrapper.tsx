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
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
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
import WeatherSection from "./WeatherSection/WeatherSection";
import { LinearGradient } from "expo-linear-gradient";
import GrientBackground from "./GrientBackground";
import WeatherEmojiOverlay from "./WeatherEmojiOverlay";
import CartItemsCount from "./CartItemsCount";

interface ScreenSafeWrapperProps {
  children: ReactNode;
  showBackButton?: boolean;
  title?: string | undefined;
  useKeyboardAvoidingView?: boolean;
  showCartIcon?: boolean;
  showSearchIcon?: boolean;
  wrapperStyle?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  headerVisible?: boolean;
  cartItems?: number;
  showWeatherSection?: boolean;
  showGradient?: boolean;
  showCartItemsCount?: boolean;
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
  showGradient = false,
  showCartItemsCount = false,
}) => {
  console.log("uytrf5698765434567890ghjk", showCartIcon);
  const WrapperComponent = useKeyboardAvoidingView
    ? KeyboardAvoidingView
    : View;
  //const router = useRouter();

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
   console.log("9876trdf4567890-ghj");
  return (
    <>
      <SafeAreaView style={[styles.container, wrapperStyle]}>
        {showGradient && (
          <GrientBackground />
        )}
      
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
                  backgroundColor:"transparent"
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
                    //router.push("/(tabs)/search");
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
              {showCartItemsCount ? (
               <CartItemsCount
               animatedHeaderStyle={animatedHeaderStyle}
               />
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


function areEqual(prevProps: ScreenSafeWrapperProps, nextProps: ScreenSafeWrapperProps) {
  return (
    prevProps.showBackButton === nextProps.showBackButton
    &&
    prevProps.title === nextProps.title
    &&
    prevProps.showBackButton === nextProps.showBackButton
    &&
    prevProps.useKeyboardAvoidingView === nextProps.useKeyboardAvoidingView
    &&
    prevProps.showCartIcon === nextProps.showCartIcon
    &&
    prevProps.showSearchIcon === nextProps.showSearchIcon
    &&
    prevProps.wrapperStyle === nextProps.wrapperStyle
    &&
    prevProps.headerStyle === nextProps.headerStyle
    &&
    prevProps.headerVisible === nextProps.headerVisible
    &&
    prevProps.showGradient === nextProps.showGradient
    &&
    prevProps.showCartItemsCount === nextProps.showCartItemsCount
  );
}

export default memo(ScreenSafeWrapper);
