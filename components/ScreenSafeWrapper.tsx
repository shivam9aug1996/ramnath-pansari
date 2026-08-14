import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { memo, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CartIcon from "./CartIcon";
import HeaderBackButton from "./HeaderBackButton";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import DeferredFadeIn from "./DeferredFadeIn";
import GrientBackground from "./GrientBackground";
import CartItemsCount from "./CartItemsCount";

interface ScreenSafeWrapperProps {
  children: ReactNode;
  showBackButton?: boolean;
  title?: string | undefined;
  useKeyboardAvoidingView?: boolean;
  showCartIcon?: boolean;
  showSearchIcon?: boolean;
  /** Extra header actions (e.g. filter) — rendered left of search/cart. */
  headerRight?: ReactNode;
  wrapperStyle?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  headerVisible?: SharedValue<number>;
  cartItems?: number;
  showWeatherSection?: boolean;
  showGradient?: boolean;
  showCartItemsCount?: boolean;
  /** Used by HeaderBackButton when there is no history. */
  backFallbackHref?: string;
  /** Icon when there is no history. Defaults to home. */
  backFallbackIcon?: ReactNode;
}

const ScreenSafeWrapper: React.FC<ScreenSafeWrapperProps> = ({
  children,
  showBackButton = true,
  title = "",
  useKeyboardAvoidingView = false,
  showCartIcon = false,
  showSearchIcon = false,
  headerRight,
  wrapperStyle = {},
  headerStyle = {},
  headerVisible,
  showGradient = false,
  showCartItemsCount = false,
  backFallbackHref,
  backFallbackIcon,
}) => {
  const WrapperComponent = useKeyboardAvoidingView
    ? KeyboardAvoidingView
    : View;

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

  const hasRightActions =
    !!headerRight || showSearchIcon || showCartIcon || showCartItemsCount;

  return (
    <>
      <SafeAreaView style={[styles.container, wrapperStyle]}>
        {showGradient && <GrientBackground />}

        <WrapperComponent
          style={{ flex: 1 }}
          behavior={
            Platform.OS === "ios" && useKeyboardAvoidingView
              ? "padding"
              : "height"
          }
        >
          <DeferredFadeIn
            delay={100}
            fallback={
              <View
                style={[styles.headerRow, headerStyle, { minHeight: showBackButton || title ? 42 : 0 }]}
              />
            }
          >
            <ThemedView
              style={[
                styles.headerRow,
                { minHeight: showBackButton || title ? 42 : 0 },
                headerStyle,
              ]}
            >
              {showBackButton ? (
                <HeaderBackButton
                  fallbackHref={backFallbackHref}
                  fallbackIcon={backFallbackIcon}
                />
              ) : (
                <View style={styles.headerSideSpacer} />
              )}

              <View style={styles.headerFlexFill} />

              {hasRightActions ? (
                <View style={styles.rightActions}>
                  {headerRight}
                  {showSearchIcon ? (
                    <TouchableOpacity
                      onPress={() => {
                        router.push("/(search)/search");
                      }}
                      style={styles.iconHit}
                      hitSlop={8}
                    >
                      <Ionicons name="search" size={24} color="#777777" />
                    </TouchableOpacity>
                  ) : null}
                  {showCartItemsCount ? (
                    <CartItemsCount animatedHeaderStyle={animatedHeaderStyle} />
                  ) : null}
                  {showCartIcon ? <CartIcon inline /> : null}
                </View>
              ) : (
                <View style={styles.headerSideSpacer} />
              )}

              {!!title && (
                <Animated.View
                  pointerEvents="none"
                  style={[styles.titleOverlay, animatedHeaderStyle]}
                >
                  <ThemedText type="screenHeader" numberOfLines={1}>
                    {title}
                  </ThemedText>
                </Animated.View>
              )}
            </ThemedView>
          </DeferredFadeIn>

          {children}
        </WrapperComponent>
      </SafeAreaView>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "transparent",
    zIndex: 2,
  },
  headerSideSpacer: {
    width: 40,
  },
  headerFlexFill: {
    flex: 1,
  },
  titleOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 96,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 0,
    zIndex: 3,
  },
  iconHit: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "400%",
  },
});

function areEqual(
  prevProps: ScreenSafeWrapperProps,
  nextProps: ScreenSafeWrapperProps,
) {
  return (
    prevProps.showBackButton === nextProps.showBackButton &&
    prevProps.title === nextProps.title &&
    prevProps.useKeyboardAvoidingView ===
      nextProps.useKeyboardAvoidingView &&
    prevProps.showCartIcon === nextProps.showCartIcon &&
    prevProps.showSearchIcon === nextProps.showSearchIcon &&
    prevProps.headerRight === nextProps.headerRight &&
    prevProps.wrapperStyle === nextProps.wrapperStyle &&
    prevProps.headerStyle === nextProps.headerStyle &&
    prevProps.headerVisible === nextProps.headerVisible &&
    prevProps.showGradient === nextProps.showGradient &&
    prevProps.showCartItemsCount === nextProps.showCartItemsCount &&
    prevProps.backFallbackHref === nextProps.backFallbackHref &&
    prevProps.backFallbackIcon === nextProps.backFallbackIcon
  );
}

export default memo(ScreenSafeWrapper);
