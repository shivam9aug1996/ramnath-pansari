import { Pressable, StyleSheet, TouchableOpacity } from "react-native";
import React, { memo } from "react";
import { ThemedText } from "../../components/ThemedText";
import { Colors } from "@/constants/Colors";
import { fonts } from "@/constants/Fonts";
import { ThemedView } from "../../components/ThemedView";
import useResendCode from "./hooks/useResendHook";

interface ResendProps {
  mobileNum: string | undefined;
  resetInput?: any;
}

const Resend = ({ resetInput, mobileNum }: ResendProps) => {
  const { canResend, countdown, handleResend, isLoading } = useResendCode(
    mobileNum,
    resetInput
  );
  //console.log("resend");

  return (
    <ThemedView
      style={{
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 25,
        alignItems: "center",
      }}
    >
      <ThemedText style={styles.resendText}>
        {canResend ? `Didn’t receive the code? ` : "Resend OTP in "}
      </ThemedText>
      <TouchableOpacity
        onPress={handleResend}
        disabled={!canResend || isLoading}
        hitSlop={{
          top: 30,
          bottom: 30,
          left: 30,
          right: 30,
        }}
      >
        {canResend ? (
          <ThemedText
            style={[
              styles.resendLink,
              {
                opacity: isLoading ? 0.5 : 1,
                pointerEvents: isLoading ? "none" : "auto",
              },
            ]}
          >
            {"Resend Code"}
          </ThemedText>
        ) : (
          <ThemedText style={styles.disabledLink}>
            {countdown > 0 && `00 : ${countdown <= 9 ? "0" : ""}${countdown}`}
          </ThemedText>
        )}
      </TouchableOpacity>
    </ThemedView>
  );
};

export default memo(Resend);

const styles = StyleSheet.create({
  resendText: {
    color: Colors.light.mediumLightGrey,
    ...(fonts.defaultNumber as any),
  },
  resendLink: {
    ...(fonts.defaultNumber as any),
    color: Colors.light.lightGreen,
  },
  disabledLink: {
    ...(fonts.defaultNumber as any),
  },
});
