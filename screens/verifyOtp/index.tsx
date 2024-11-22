import React from "react";
import { StyleSheet, TouchableWithoutFeedback, View } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import Input from "@/screens/verifyOtp/Input";
import Resend from "@/screens/verifyOtp/Resend";
import TermsCheck from "@/screens/verifyOtp/TermsCheck";
import useVerifyOtp from "./hooks/useVerifyOtp";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import Button from "@/components/Button";

const VerifyOtp: React.FC = () => {
  const {
    isLoading,
    errorState,
    inputValues,
    setInputValues,
    inputRef,
    dismissKeyboard,
    resetInput,
    userAlreadyRegistered,
    handleVerifyOtp,
    setErrorState,
    mobileNumber,
  } = useVerifyOtp();

  return (
    <ScreenSafeWrapper useKeyboardAvoidingView={true}>
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <ThemedView style={styles.container}>
          <View style={{ flex: 0.15, marginTop: 10 }}></View>
          <ThemedText type="title">{"Verify your\nIdentity"}</ThemedText>

          <ThemedText style={styles.description}>
            {"We have just sent a code to your\nmobile number"}
          </ThemedText>
          <Input
            setInputValues={setInputValues}
            inputValues={inputValues}
            ref={inputRef}
            setErrorState={setErrorState}
          />
          {errorState && (
            <ThemedText
              lightColor={Colors.light.lightRed}
              style={styles.errorText}
            >
              {errorState}
            </ThemedText>
          )}
          <Resend resetInput={resetInput} mobileNum={mobileNumber} />
          <Button
            title="Verification"
            isLoading={isLoading}
            onPress={handleVerifyOtp}
          />
          {userAlreadyRegistered === "false" && <TermsCheck />}
        </ThemedView>
      </TouchableWithoutFeedback>
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
  errorText: {
    marginTop: 8,
  },
});

export default VerifyOtp;
