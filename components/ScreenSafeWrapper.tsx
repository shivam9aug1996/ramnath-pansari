import GoToCart from "@/app/(private)/(category)/ProductList/GoToCart";
import { Colors } from "@/constants/Colors";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import { RootState } from "@/types/global";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useRouter } from "expo-router";
import React, { memo, ReactNode } from "react";
import {
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
}) => {
  console.log("uytrfghjk", showCartIcon);
  const WrapperComponent = useKeyboardAvoidingView
    ? KeyboardAvoidingView
    : View;
  //const router = useRouter();
  const userId = useSelector((state: RootState) => state.auth?.userData?._id);

  return (
    <>
      <SafeAreaView style={styles.container}>
        <WrapperComponent
          style={{ flex: 1 }}
          behavior={
            Platform.OS === "ios" && useKeyboardAvoidingView
              ? "padding"
              : "height"
          }
        >
          <ThemedView
            style={{
              flexDirection: "row",
              alignItems: "center",
              position: "relative",
              minHeight: showBackButton || title ? 42 : 0,
            }}
          >
            {showBackButton && <HeaderBackButton />}
            {title && (
              <ThemedView
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  alignItems: "center",
                  zIndex: -1,
                  backgroundColor: "transparent",
                }}
              >
                <ThemedText type="screenHeader">{title}</ThemedText>
              </ThemedView>
            )}
            {showSearchIcon && (
              <TouchableOpacity
                onPress={() => {
                  router.push("/(search)/search");
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
            {showCartIcon && <CartIcon />}
          </ThemedView>
          {children}
        </WrapperComponent>
      </SafeAreaView>
      {/* <GoToCart /> */}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 30,
    paddingTop: Platform.OS == "android" ? 20 : 10,
  },
});

export default memo(ScreenSafeWrapper);
