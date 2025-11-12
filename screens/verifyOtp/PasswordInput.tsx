import React, { useState, useRef, useEffect } from "react";
import {
  TextInput,
  StyleSheet,
  View,
  Pressable,
  Keyboard,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  password: string;
  setPassword: (val: string) => void;
  setErrorState: (val: string) => void;
  onSubmitPassword: (val: string) => void;
  placeholder?: string;
}

const PasswordInput: React.FC<Props> = ({ 
  password, 
  setPassword, 
  setErrorState, 
  onSubmitPassword,
  placeholder = "Enter your password"
}) => {
  const inputRef = useRef<TextInput>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Force focus when component mounts
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  const handleChange = (text: string) => {
    setPassword(text);
    setErrorState("");
  };

  const handleSubmit = () => {
    if (password.trim()) {
      Keyboard.dismiss();
      onSubmitPassword(password);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Focus input when user taps anywhere
  const handlePress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} style={styles.inputContainer}>
        <Ionicons
          style={styles.prefix}
          name="lock-closed-outline"
          size={20}
          color={Colors.light.mediumGrey}
        />
        
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={password}
          onChangeText={handleChange}
          secureTextEntry={!showPassword}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.mediumLightGrey}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
        />

        {/* Always render the eye icon container to prevent layout shift */}
        <View style={styles.eyeIconContainer}>
          {password.length > 0 && (
            <Pressable onPress={togglePasswordVisibility} style={styles.eyeIcon}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={Colors.light.mediumGrey}
              />
            </Pressable>
          )}
        </View>
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
    position: "relative",
  },
  prefix: {
    marginRight: 15,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.darkGrey,
    fontFamily: "Montserrat_500Medium",
    paddingRight: 10,
  },
  eyeIconContainer: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  eyeIcon: {
    padding: 5,
  },
});

export default PasswordInput;