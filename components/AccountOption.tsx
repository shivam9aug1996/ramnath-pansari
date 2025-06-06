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
    flex: 1,
  } as ViewStyle,
  optionLabel: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 14,
    color: Colors.light.darkGrey,
    marginLeft: 16,
    flex: 1,
    letterSpacing: 0.3,
  } as TextStyle,
  optionContainer: {
    backgroundColor: Colors.light.white,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flex: 1,
    alignItems: "center",
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 1,
    // },
    // shadowOpacity: 0.08,
    // shadowRadius: 4,
    // elevation: 2,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.light.lightGrey,
    
  } as ViewStyle,
});
