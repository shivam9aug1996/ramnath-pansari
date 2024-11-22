import React, { memo } from "react";
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { fonts } from "@/constants/Fonts";
import { ViewStyle } from "react-native";

interface ButtonProps {
  onPress: () => void;
  title: string;
  isLoading?: boolean;
  wrapperStyle?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  isLoading = false,
  onPress,
  title = "",
  wrapperStyle = {},
  textStyle = {},
  disabled = false,
}) => {
  const handleOnPress = () => {
    Keyboard.dismiss();
    onPress();
  };
  return (
    <TouchableOpacity
      style={[styles.buttonContainer, wrapperStyle]}
      disabled={isLoading || disabled}
      onPress={handleOnPress}
    >
      <LinearGradient
        colors={[Colors.light.gradientGreen_2, Colors.light.gradientGreen_1]}
        style={styles.button}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.light.white} />
        ) : (
          <ThemedText
            lightColor={Colors.light.white}
            darkColor={Colors.dark.darkGreen_3}
            style={[styles.buttonText, textStyle]}
          >
            {title}
          </ThemedText>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default memo(Button);

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 35,
  },
  button: {
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  buttonText: {
    ...fonts.defaultSemiBold,
    fontWeight: "700",
    paddingVertical: 2,
  },
});
