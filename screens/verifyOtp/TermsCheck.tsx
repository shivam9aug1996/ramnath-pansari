import { StyleSheet, TouchableOpacity, View } from "react-native";
import React, { useCallback } from "react";

import { Colors } from "@/constants/Colors";
import { fonts } from "@/constants/Fonts";

import { debounce } from "@/utils/utils";
import { router } from "expo-router";
import usePreventDoubleTap from "@/hooks/usePreventDoubleTap";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const TermsCheck = () => {
  const debouncedPress = usePreventDoubleTap();

  const onPress = () => {
    debouncedPress(() => {
      router.navigate("/terms");
    });
  };

  return (
    <ThemedView
      style={{
        flexDirection: "column",
        justifyContent: "center",
        marginTop: 15,
        alignItems: "center",
      }}
    >
      <ThemedText style={styles.resendText}>
        {"By Signin up, you agree to our"}
      </ThemedText>
      <TouchableOpacity onPress={onPress}>
        <ThemedText style={styles.resendLink}>
          {"Term and Conditions"}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};

export default TermsCheck;

const styles = StyleSheet.create({
  resendText: {
    color: Colors.light.mediumLightGrey,
    lineHeight: 19,
  },
  resendLink: {
    ...(fonts.defaultBold as any),
    fontSize: 14,
    color: Colors.light.lightGreen,
    lineHeight: 19,
  },
  disabledLink: {
    ...(fonts.defaultNumber as any),
  },
});
