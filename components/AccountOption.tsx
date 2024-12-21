import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { memo } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { ViewStyle } from "react-native";
import { TextStyle } from "react-native";

interface AccountOptionProps {
  icon: React.ReactNode;
  label: string;
  onPress: any;
  iconColor?: string;
}

const AccountOption: React.FC<AccountOptionProps> = ({
  icon,
  label,
  onPress,
}) => (
  <TouchableOpacity style={styles.optionContainer} onPress={onPress}>
    <View style={styles.optionContent}>
      {icon}
      <Text style={styles.optionLabel}>{label}</Text>
    </View>
    <MaterialIcons
      name="navigate-next"
      size={18}
      color={Colors.light.mediumGrey}
    />
  </TouchableOpacity>
);

export default memo(AccountOption);

const styles = StyleSheet.create({
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  } as ViewStyle,
  optionLabel: {
    fontFamily: "Raleway_500Medium",
    fontSize: 10,
    color: Colors.light.mediumGrey,
    marginLeft: 23.5,
  } as TextStyle,
  optionContainer: {
    backgroundColor: "#F1F3F2",
    borderRadius: 23,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    flex: 1,
    alignItems: "center",
  } as ViewStyle,
});
