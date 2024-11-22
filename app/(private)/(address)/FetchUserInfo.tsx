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

      <Ionicons name="person" size={16} color={Colors.light.mediumGreen} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
  buttonText: {
    color: Colors.light.mediumGreen,
    fontSize: 14,
    fontFamily: "Raleway_600SemiBold",
    marginRight: 4,
  },
});

export default FetchUserInfo;
