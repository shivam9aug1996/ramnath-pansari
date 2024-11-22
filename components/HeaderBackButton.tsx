import React, { useCallback } from "react";
import { Image, TouchableOpacity } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { router, useRouter } from "expo-router";
import { debounce } from "@/utils/utils";
import usePreventDoubleTap from "@/hooks/usePreventDoubleTap";

type Props = {
  onPress?: () => void;
};

const HeaderBackButton: React.FC<Props> = ({ onPress }) => {
  const colorScheme = useColorScheme();
  const debouncedPress = usePreventDoubleTap();

  const handleBack = () => {
    if (onPress) {
      debouncedPress(() => {
        onPress?.();
      });
    } else {
      debouncedPress(() => {
        router?.back();
      });
    }
  };

  return (
    <TouchableOpacity onPress={handleBack} style={{ alignSelf: "flex-start" }}>
      <ThemedView
        style={{
          borderWidth: 1,
          borderColor:
            colorScheme === "dark"
              ? Colors.dark.softGrey_2
              : "rgba(119, 119, 119, 0.2)",
          paddingHorizontal: 21,
          paddingVertical: 11,
          borderRadius: 100,

          // marginLeft: 10,
        }}
      >
        <Image
          tintColor={colorScheme === "dark" ? Colors.dark.lightGrey : "#777777"}
          source={require("../assets/images/bi_arrow-right.png")}
          style={{
            width: 18,
            height: 18,
            transform: [{ rotate: "180deg" }],
          }}
        />
      </ThemedView>
    </TouchableOpacity>
  );
};

export default HeaderBackButton;
