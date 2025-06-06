import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSendOtp } from "@/screens/login/hooks/useSendOtp";
import { useSendOtpMutation } from "@/redux/features/authSlice";
import { useFocusEffect } from "expo-router";

const RESEND_TIMESTAMP_KEY = "RESEND_TIMESTAMP_KEY";
const RESEND_INTERVAL = 1 * 30000; // 30 seconds in milliseconds

export const getResendTime = async (mobileNum: any) => {
  try {
    const lastResend = await AsyncStorage.getItem(
      `${RESEND_TIMESTAMP_KEY}_${mobileNum}`
    );
    if (lastResend !== null) {
      const lastResendTime = parseInt(lastResend, 10);
      const currentTime = Date.now();
      const timeElapsed = currentTime - lastResendTime;

      if (timeElapsed < RESEND_INTERVAL) {
        return Math.ceil((RESEND_INTERVAL - timeElapsed) / 1000);
      } else {
        return 0;
      }
    }
  } catch (error) {
    console.error("Failed to check resend eligibility", error);
  }
};

export const setResendTime = async (mobileNum: any) => {
  await AsyncStorage.setItem(
    `${RESEND_TIMESTAMP_KEY}_${mobileNum}`,
    Date.now().toString()
  );
};

const useResendCode = (
  mobileNum: string | undefined,
  resetInput?: () => void
) => {
  const [sendOtp, { isLoading, data, isSuccess }] = useSendOtpMutation();
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    checkResendEligibility(mobileNum);
  }, [mobileNum]);

  useEffect(() => {
    if (isSuccess) {
      startResendTimer();
    }
  }, [isSuccess]);

  useEffect(() => {
    let timerId: any;
    if (countdown > 0 && !canResend) {
      timerId = setTimeout(() => {
        setCountdown(countdown - 1);
        if (countdown === 1) {
          setCanResend(true);
        }
      }, 1000);
    }
    return () => clearTimeout(timerId);
  }, [countdown, canResend]);

  const checkResendEligibility = async (mobileNum: any) => {
    try {
      const lastResend = await AsyncStorage.getItem(
        `${RESEND_TIMESTAMP_KEY}_${mobileNum}`
      );
      if (lastResend !== null) {
        const lastResendTime = parseInt(lastResend, 10);
        const currentTime = Date.now();
        const timeElapsed = currentTime - lastResendTime;

        if (timeElapsed < RESEND_INTERVAL) {
          setCanResend(false);
          setCountdown(Math.ceil((RESEND_INTERVAL - timeElapsed) / 1000));
        }
      }
    } catch (error) {
      console.error("Failed to check resend eligibility", error);
    }
  };

  const handleResend = async () => {
    sendOtp({ mobileNumber: mobileNum || "" });
  };

  const startResendTimer = async () => {
    try {
      resetInput?.();
      await AsyncStorage.setItem(
        `${RESEND_TIMESTAMP_KEY}_${mobileNum}`,
        Date.now().toString()
      );
      setCanResend(false);
      setCountdown(RESEND_INTERVAL / 1000);
    } catch (error) {
      console.error("Failed to save resend timestamp", error);
    }
  };

  return {
    canResend,
    countdown,
    handleResend,
    checkResendEligibility,
    isLoading,
  };
};

export default useResendCode;
