import React, { memo, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { useTypingEffect } from "@/hooks/useTypingEffect";

interface GreetingMessageProps {
  message: string;
  loading: boolean;
}

const GreetingMessage: React.FC<GreetingMessageProps> = ({ message, loading }) => {
  //const displayedText = message;
  // useTypingEffect is already optimized.
  const displayedText = useTypingEffect(message);

  // Memoize the condition for rendering the cursor to avoid re-calculating on every render
  const showCursor = useMemo(() => !loading && displayedText.length < message.length, [loading, displayedText, message]);

  return (
    <View style={styles.container}>
      <Text style={styles.subtitleText}>
        {displayedText}
        {showCursor ? "|" : ""}
      </Text>
    </View>
  );
};

export default memo(GreetingMessage);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  subtitleText: {
    fontFamily: "Raleway_500Medium",
    fontSize: 16,
    color: Colors.light.mediumLightGrey,
    paddingTop: 8,
  },
});