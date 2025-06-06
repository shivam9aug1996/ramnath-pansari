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
  variant?: 'default' | 'cart';
}

const Button: React.FC<ButtonProps> = ({
  isLoading = false,
  onPress,
  title = "",
  wrapperStyle = {},
  textStyle = {},
  disabled = false,
  variant = 'default',
}) => {
  const handleOnPress = () => {
    Keyboard.dismiss();
    onPress();
  };
  return (
    <TouchableOpacity
      style={[
        styles.buttonContainer,
        variant === 'cart' && styles.cartButtonContainer,
        wrapperStyle
      ]}
      disabled={isLoading || disabled}
      onPress={handleOnPress}
    >
      <LinearGradient
        colors={[Colors.light.gradientGreen_2 || '#4CBB5E', Colors.light.gradientGreen_1 || '#26AD71']}
        style={[
          styles.button,
          variant === 'cart' && styles.cartButton
        ]}
      >
        {isLoading ? (
          <ActivityIndicator
            style={{ paddingVertical: variant === 'cart' ? 0 : 1.5 }}
            color={Colors.light.white}
          />
        ) : (
          <ThemedText
            lightColor={Colors.light.white}
            
            style={[
              styles.buttonText,
              variant === 'cart' && styles.cartButtonText,
              textStyle
            ]}
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
  cartButtonContainer: {
    marginTop: 15,
  },
  button: {
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  cartButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    ...fonts.defaultSemiBold,
    fontWeight: "700",
    paddingVertical: 2,
  },
  cartButtonText: {
    paddingVertical: 0,
    fontSize: 14,
  },
});
