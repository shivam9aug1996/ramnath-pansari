import React, { ReactNode } from "react";
import { TouchableOpacity } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import usePreventDoubleTap from "@/hooks/usePreventDoubleTap";
import { Image } from "expo-image";

type Props = {
  onPress?: () => void;
  /** Used when there is no history (e.g. web refresh on a deep link). */
  fallbackHref?: string;
  /** Icon when there is no history. Defaults to home. */
  fallbackIcon?: ReactNode;
};

const DEFAULT_FALLBACK = "/(private)/(tabs)/home";
const ICON_COLOR = "#777777";

const HeaderBackButton: React.FC<Props> = ({
  onPress,
  fallbackHref = DEFAULT_FALLBACK,
  fallbackIcon,
}) => {
  const debouncedPress = usePreventDoubleTap();
  const canGoBack = router.canGoBack();
  const useFallback = !onPress && !canGoBack;

  const handleBack = () => {
    if (onPress) {
      debouncedPress(() => {
        onPress?.();
      });
      return;
    }
    debouncedPress(() => {
      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.replace(fallbackHref as Parameters<typeof router.replace>[0]);
    });
  };

  return (
    <TouchableOpacity
      onPress={handleBack}
      style={{ alignSelf: "flex-start" }}
      accessibilityRole="button"
      accessibilityLabel={useFallback ? "Home" : "Back"}
    >
      <ThemedView
        style={{
          borderWidth: 1,
          borderColor: "rgba(119, 119, 119, 0.2)",
          paddingHorizontal: 21,
          paddingVertical: 11,
          borderRadius: 100,
          backgroundColor: "transparent",
        }}
      >
        {useFallback ? (
          fallbackIcon ?? (
            <Ionicons name="home-outline" size={18} color={ICON_COLOR} />
          )
        ) : (
          <Image
            tintColor={ICON_COLOR}
            source={require("../assets/images/bi_arrow-right.png")}
            style={{
              width: 18,
              height: 18,
              transform: [{ rotate: "180deg" }],
            }}
          />
        )}
      </ThemedView>
    </TouchableOpacity>
  );
};

export default HeaderBackButton;
