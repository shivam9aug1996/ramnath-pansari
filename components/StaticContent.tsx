import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/Colors";
import { fonts } from "@/constants/Fonts";
import { useRouter } from "expo-router";
import Button from "./Button";
import AsyncStorage from "@react-native-async-storage/async-storage";
import usePreventDoubleTap from "@/hooks/usePreventDoubleTap";

const StaticContent = () => {
  const router = useRouter();
  const debouncedPress = usePreventDoubleTap();
  const onPress = () => {
    debouncedPress(() => {
      router.push("/(private)/(tabs)/home");
    });
  };
  return (
    <ThemedView
      style={{
        flex: 1,
        paddingHorizontal: 30,
      }}
    >
      <Button title="Browse Home" onPress={onPress} />
    </ThemedView>
  );
};

export default StaticContent;

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 35,
    alignItems: "center",
  },
  button: {
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    width: "100%",
  },
  buttonText: {
    ...(fonts.defaultSemiBold as any),
  },
});
