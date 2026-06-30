import React, { useRef, useEffect } from "react";
import {
  TextInput,
  StyleSheet,
  View,
  Pressable,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  otp: string;
  setOtp: (val: string) => void;
  setErrorState: (val: string) => void;
  placeholder?: string;
}

const OtpInput: React.FC<Props> = ({
  otp,
  setOtp,
  setErrorState,
  placeholder = "Enter 6-digit OTP",
}) => {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  const handleChange = (text: string) => {
    const filtered = text.replace(/[^0-9]/g, "").slice(0, 6);
    setOtp(filtered);
    setErrorState("");
  };

  const handlePress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} style={styles.inputContainer}>
        <Ionicons
          style={styles.prefix}
          name="mail-outline"
          size={20}
          color={Colors.light.mediumGrey}
        />

        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={otp}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.mediumLightGrey}
          keyboardType="number-pad"
          maxLength={6}
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 20,
  },
  inputContainer: {
    width: "100%",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "#f2f4f3",
    flexDirection: "row",
    alignItems: "center",
  },
  prefix: {
    marginRight: 15,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.darkGrey,
    fontFamily: "Montserrat_500Medium",
  },
});

export default OtpInput;
