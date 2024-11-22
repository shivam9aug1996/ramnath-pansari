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

const FetchLocation: React.FC<ButtonProps> = ({
  title = "Get current location",
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
      <View style={{ height: 20, width: 20, marginRight: 10 }}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={Colors.light.mediumGreen}
            // style={{ marginRight: 5 }}
          />
        )}
      </View>

      <Text style={styles.buttonText}>{title}</Text>

      <Ionicons
        name="location-sharp"
        size={16}
        color={Colors.light.mediumGreen}
      />
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

export default FetchLocation;
