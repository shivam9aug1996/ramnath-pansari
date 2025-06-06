import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  View,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

interface ButtonProps {
  onPress: () => void;
  loading?: boolean;
  wrapperStyle?: object;
  title?: string;
}

const FetchUserInfo: React.FC<ButtonProps> = ({
  title = "Get my info",
  onPress,
  loading,
  wrapperStyle,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, wrapperStyle]}
      disabled={loading}
    >
      <Text style={styles.buttonText}>{title}</Text>

      {loading ? (
        <ActivityIndicator size="small" color={Colors.light.mediumGreen} />
      ) : (
        <Ionicons name="person" size={16} color={Colors.light.mediumGreen} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.mediumGreen,
  },
  buttonText: {
    color: Colors.light.mediumGreen,
    fontSize: 14,
    fontFamily: "Raleway_600SemiBold",
    marginRight: 6,
  },
});

export default FetchUserInfo;
