import React, { memo } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Button from "@/components/Button";
import { Colors } from "@/constants/Colors";

interface TryAgainProps {
  refetch: () => void;
  title?: string;
  message?: string;
  compact?: boolean;
  style?: ViewStyle;
}

const TryAgain: React.FC<TryAgainProps> = ({
  refetch,
  title = "Something went wrong",
  message = "We couldn't load this right now. Please check your connection and try again.",
  compact = false,
  style,
}) => {
  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        style,
      ]}
    >
      <View style={[styles.iconWrap, compact && styles.iconWrapCompact]}>
        <MaterialCommunityIcons
          name="cloud-refresh-outline"
          size={compact ? 22 : 28}
          color={Colors.light.lightGreen}
        />
      </View>

      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      <Text style={[styles.message, compact && styles.messageCompact]}>
        {message}
      </Text>

      <View style={[styles.buttonRow, compact && styles.buttonRowCompact]}>
        <Button
          title="Try Again"
          onPress={refetch}
          variant="cart"
          wrapperStyle={styles.buttonWrap}
        />
      </View>
    </View>
  );
};

export default memo(TryAgain);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  containerCompact: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.softGrey_1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  iconWrapCompact: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 10,
  },
  title: {
    fontFamily: "Raleway_800ExtraBold",
    fontSize: 18,
    color: Colors.light.darkGreen,
    textAlign: "center",
    marginBottom: 6,
  },
  titleCompact: {
    fontSize: 15,
    marginBottom: 4,
  },
  message: {
    fontFamily: "Raleway_500Medium",
    fontSize: 13,
    lineHeight: 20,
    color: Colors.light.mediumLightGrey,
    textAlign: "center",
    maxWidth: 300,
  },
  messageCompact: {
    fontSize: 12,
    lineHeight: 17,
    maxWidth: 260,
  },
  buttonRow: {
    width: "100%",
    alignItems: "center",
    marginTop: 22,
  },
  buttonRowCompact: {
    marginTop: 14,
  },
  buttonWrap: {
    marginTop: 0,
    alignSelf: "center",
  },
});
