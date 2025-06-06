import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ContactTab() {
  return (
    <View style={styles.container}>
      <Text>You can find me online here:</Text>
      <Text>admin@mysite.com</Text>
      <Text>+123456789</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
