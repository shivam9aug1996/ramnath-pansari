import { StyleSheet, TouchableOpacity, View } from "react-native";
import React from "react";

import { Colors } from "@/constants/Colors";
import { fonts } from "@/constants/Fonts";

import { router } from "expo-router";
import usePreventDoubleTap from "@/hooks/usePreventDoubleTap";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const TermsCheck = () => {
  const debouncedPress = usePreventDoubleTap();

  const openTerms = () => {
    debouncedPress(() => {
      router.navigate("/terms");
    });
  };

  const openPrivacy = () => {
    debouncedPress(() => {
      router.navigate("/privacy");
    });
  };

  return (
    <ThemedView style={styles.wrap}>
      <ThemedText style={styles.resendText}>
        By signing up, you agree to our
      </ThemedText>
      <View style={styles.linksRow}>
        <TouchableOpacity onPress={openTerms} accessibilityRole="link">
          <ThemedText style={styles.resendLink}>Terms & Conditions</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.resendText}> and </ThemedText>
        <TouchableOpacity onPress={openPrivacy} accessibilityRole="link">
          <ThemedText style={styles.resendLink}>Privacy Policy</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
};

export default TermsCheck;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "column",
    justifyContent: "center",
    marginTop: 15,
    alignItems: "center",
  },
  linksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
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
});
