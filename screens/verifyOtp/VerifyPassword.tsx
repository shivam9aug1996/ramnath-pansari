import React from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { Colors } from "@/constants/Colors";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Button from "@/components/Button";
import DeferredFadeIn from "@/components/DeferredFadeIn";

import useVerifyPassword from "./hooks/useVerifyPassword";
import PasswordInput from "./PasswordInput";
import OtpInput from "./OtpInput";
import Resend from "./Resend";
import TermsCheck from "./TermsCheck";

const VerifyPassword: React.FC = () => {
  const {
    isLoading,
    errorState,
    password,
    setPassword,
    otp,
    setOtp,
    isAdminLogin,
    isDriverLogin,
    requiresEmailOtp,
    otpSentTo,
    resetInput,
    userAlreadyRegistered,
    handleVerifyPassword,
    setErrorState,
    mobileNumber,
  } = useVerifyPassword();

  const isNewUser = userAlreadyRegistered === "false";

  return (
    <ScreenSafeWrapper
      showBackButton
      useKeyboardAvoidingView={false}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={10}
      >
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
          accessible={false}
        >
          <DeferredFadeIn style={{ flex: 1 }} delay={200}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              automaticallyAdjustKeyboardInsets
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <ThemedView style={styles.container}>
                <View>
                  <ThemedText type="title">
                    {isAdminLogin
                      ? "Admin\nLogin"
                      : isDriverLogin
                        ? "Driver\nLogin"
                        : isNewUser
                          ? "Create your\nPassword"
                          : "Enter your\nPassword"}
                  </ThemedText>

                  <ThemedText style={styles.description}>
                    {requiresEmailOtp
                      ? `Enter password and the OTP sent to\n${
                          otpSentTo || "your email"
                        }`
                      : isNewUser
                        ? "Create a strong password to\nsecure your account"
                        : "Please enter your password to\ncontinue"}
                  </ThemedText>

                  {requiresEmailOtp && (
                    <>
                      <OtpInput
                        otp={otp}
                        setOtp={setOtp}
                        setErrorState={setErrorState}
                      />

                      <Resend
                        resetInput={resetInput}
                        mobileNum={mobileNumber}
                      />
                    </>
                  )}

                  <PasswordInput
                    password={password}
                    setPassword={setPassword}
                    setErrorState={setErrorState}
                    onSubmitPassword={handleVerifyPassword}
                    placeholder={
                      isNewUser
                        ? "Create your password"
                        : "Enter your password"
                    }
                    autoFocus={!requiresEmailOtp}
                  />

                  <View style={styles.errorContainer}>
                    {!!errorState && (
                      <ThemedText
                        lightColor={Colors.light.lightRed}
                        style={styles.errorText}
                      >
                        {errorState}
                      </ThemedText>
                    )}
                  </View>
                </View>

                <View>
                  <Button
                    title={isNewUser ? "Create Account" : "Continue"}
                    isLoading={isLoading}
                    onPress={() => handleVerifyPassword(password)}
                  />

                  {isNewUser && !requiresEmailOtp && (
                    <View style={{ marginTop: 16 }}>
                      <TermsCheck />
                    </View>
                  )}
                </View>
              </ThemedView>
            </ScrollView>
          </DeferredFadeIn>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenSafeWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 40,
  },

  container: {
    flex: 1,
    justifyContent: "space-between",
  },

  description: {
    color: Colors.light.mediumLightGrey,
    marginTop: 18,
    lineHeight: 20,
    marginBottom: 30,
  },

  errorContainer: {
    minHeight: 22,
    justifyContent: "center",
  },

  errorText: {
    color: Colors.light.lightRed,
  },
});

export default VerifyPassword;