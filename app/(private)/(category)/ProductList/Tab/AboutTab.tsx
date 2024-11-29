import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function AboutTab() {
  return (
    <View style={styles.container}>
      <Text>Welcome to my profile!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
