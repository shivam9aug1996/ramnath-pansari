import React from "react";
import {
  Keyboard,
  TouchableWithoutFeedback,
  StyleSheet,
  TextInput,
} from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useSendOtp } from "./hooks/useSendOtp";
import CustomTextInput from "../../components/CustomTextInput";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import Button from "@/components/Button";
import DeferredFadeIn from "@/components/DeferredFadeIn";

const Login: React.FC = () => {
  const {
    mobileNumber,
    errorState,
    isLoading,
    textInputRef,
    handleChange,
    handleSignIn,
  } = useSendOtp();

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <ScreenSafeWrapper useKeyboardAvoidingView={false}>
     <DeferredFadeIn style={{flex:1}} delay={200}>
     <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <ThemedView style={styles.container}>
          <ThemedText type="title">{"Welcome to\nRamnath Pansari!"}</ThemedText>
          <ThemedText style={styles.label}>{"Phone Number"}</ThemedText>
          <CustomTextInput
            value={mobileNumber}
            onChangeText={handleChange}
            textInputRef={textInputRef}
            type={"phone"}
          />
          {errorState && (
            <ThemedText
              lightColor={Colors.light.lightRed}
              style={styles.errorText}
            >
              {errorState}
            </ThemedText>
          )}
          <Button
            title="Continue"
            isLoading={isLoading}
            onPress={handleSignIn}
          />
        </ThemedView>
      </TouchableWithoutFeedback>
     </DeferredFadeIn>
    </ScreenSafeWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 55,
  },
  label: {
    marginBottom: 10,
    marginTop: 60,
    color: Colors.light.mediumLightGrey,
  },
  errorText: {
    marginTop: 8,
  },
});

export default Login;
