import React, { useEffect, useRef } from "react";
import {
  TextInput,
  StyleSheet,
  View,
  Text,
  Pressable,
  Keyboard,
} from "react-native";
import { Colors } from "@/constants/Colors";

interface Props {
  otp: string;
  setOtp: (val: string) => void;
  setErrorState: (val: string) => void;
  onSubmitOtp: (val: string) => void;
}

const SingleOtpInput: React.FC<Props> = ({ otp, setOtp, setErrorState, onSubmitOtp }) => {
  const inputRef = useRef<TextInput>(null);
  useEffect(() => {
    // 🚀 Force focus when component mounts
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);
  const handleChange = (text: string) => {
    const filteredText = text.replace(/[^0-9]/g, "").slice(0, 6);
    setOtp(filteredText);
    setErrorState("");
  
    // 🚀 Auto-submit when 6 digits entered
    if (filteredText.length === 6) {
      Keyboard.dismiss()
      //console.log("filteredText", filteredText);
      onSubmitOtp(filteredText);
    }
  };
  

  // Split OTP into array for boxes
  const otpChars = otp.split("");

  // Focus input when user taps anywhere
  const handlePress = () => {
    //console.log("handlePress");
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      {/* Hidden TextInput */}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        keyboardType="number-pad"
        value={otp}
        onChangeText={handleChange}
        maxLength={6}
        placeholder=""
        autoFocus
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
      />

      {/* Fake Boxes wrapped in Pressable */}
      <Pressable onPress={handlePress} style={styles.boxContainer}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.box,
              {
                borderColor:
                  index === otp.length ? Colors.light.gradientGreen_2 : Colors.light.lightGrey,
              },
            ]}
          >
            <Text style={styles.boxText}>{otpChars[index] || ""}</Text>
          </View>
        ))}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    alignItems: "center",
    width: "100%",
  },
  hiddenInput: {
    // Hidden but functional
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  boxContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
  },
  box: {
    width: 48,
    height: 58,
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.softGrey_2,
  },
  boxText: {
    fontSize: 26,
    fontWeight: "600",
    color: Colors.light.darkGrey,
  },
});

export default SingleOtpInput;
