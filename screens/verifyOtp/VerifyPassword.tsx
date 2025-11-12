import React from "react";
import { StyleSheet, TouchableWithoutFeedback, View } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import Button from "@/components/Button";
import useVerifyPassword from "./hooks/useVerifyPassword";
import PasswordInput from "./PasswordInput";
import TermsCheck from "./TermsCheck";
import DeferredFadeIn from "@/components/DeferredFadeIn";

const VerifyPassword: React.FC = () => {
  const {
    isLoading,
    errorState,
    password,
    setPassword,
    dismissKeyboard,
    resetInput,
    userAlreadyRegistered,
    handleVerifyPassword,
    setErrorState,
    mobileNumber,
  } = useVerifyPassword();

  const isNewUser = userAlreadyRegistered === "false";
  
  return (
    <ScreenSafeWrapper useKeyboardAvoidingView={true}>
     <DeferredFadeIn style={{flex:1}} delay={200}>
     <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <ThemedView style={styles.container}>
          <View style={{ flex: 0.15, marginTop: 10 }}></View>
          <ThemedText type="title">
            {isNewUser ? "Create your\nPassword" : "Enter your\nPassword"}
          </ThemedText>

          <ThemedText style={styles.description}>
            {isNewUser 
              ? "Create a strong password to\nsecure your account"
              : "Please enter your password to\ncontinue"
            }
          </ThemedText>
          
          <PasswordInput 
            password={password} 
            setPassword={setPassword} 
            setErrorState={setErrorState} 
            onSubmitPassword={handleVerifyPassword}
            placeholder={isNewUser ? "Create your password" : "Enter your password"}
          />

          <View style={styles.errorContainer}>
            {errorState && (
              <ThemedText
                lightColor={Colors.light.lightRed}
                style={styles.errorText}
              >
                {errorState}
              </ThemedText>
            )}
          </View>

          <Button
            title={isNewUser ? "Create Account" : "Continue"}
            isLoading={isLoading}
            onPress={() => {
              handleVerifyPassword(password);
            }}
          />
          {isNewUser && <TermsCheck />}
        </ThemedView>
      </TouchableWithoutFeedback>
     </DeferredFadeIn>
    </ScreenSafeWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  description: {
    color: Colors.light.mediumLightGrey,
    marginTop: 18,
    lineHeight: 19,
  },
  errorContainer: {
    minHeight: 20,
    justifyContent: 'center',
  },
  errorText: {
    // Remove marginTop since it's handled by the container
  },
  forgotPasswordButton: {
    marginTop: 20,
  },
});

export default VerifyPassword;