import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function TabButton({ children, isActive, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, isActive && styles.activeButton]}
    >
      <Text style={[styles.text, isActive && styles.activeText]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#ddd",
    paddingVertical: 20,
  },
  activeButton: {
    backgroundColor: "#6200ee",
  },
  text: {
    color: "#000",
    fontWeight: "bold",
  },
  activeText: {
    color: "#fff",
  },
});
