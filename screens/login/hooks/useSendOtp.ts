import { useEffect, useState, useRef, useCallback } from "react";

import { useSendOtpMutation } from "@/redux/features/authSlice";
import { validateMobileNumber } from "../utils/utils";
import {
  getResendTime,
  setResendTime,
} from "@/screens/verifyOtp/hooks/useResendHook";
import { router } from "expo-router";
import { showToast } from "@/utils/utils";

interface UseSendOtpProps {
  mobileNumber: string;
  errorState: string;
  isLoading: boolean;
  textInputRef: React.RefObject<any>;
  handleChange: (value: string) => void;
  handleSignIn: () => void;
}

export const useSendOtp = (): UseSendOtpProps => {
  const [sendOtp, { isLoading, data, isSuccess }] = useSendOtpMutation();

  const [mobileNumber, setMobileNumber] = useState("");
  const [errorState, setErrorState] = useState("");
  const textInputRef = useRef<any>(null);

  useEffect(() => {
    if (isSuccess) {
      router.push({
        pathname: "/verify",
        params: {
          mobileNumber,
          userAlreadyRegistered: data?.userAlreadyRegistered?.toString(),
        },
      });
      setResendTime(mobileNumber);
    }
  }, [isSuccess, router]);

  const handleChange = useCallback(
    (value: string) => {
      if (errorState) {
        setErrorState("");
      }
      if (value.length <= 10) {
        setMobileNumber(value);
      }
    },
    [errorState]
  );

  const handleSignIn = useCallback(async () => {
    const validationError = validateMobileNumber(mobileNumber);
    if (validationError) {
      setErrorState(validationError);
    } else {
      let timeLeft = await getResendTime(mobileNumber);
      if (timeLeft) {
        showToast({ type: "error", text2: `Try again in ${timeLeft} seconds` });
      } else {
        sendOtp({ mobileNumber });
      }
    }
  }, [mobileNumber, sendOtp]);

  return {
    mobileNumber,
    errorState,
    isLoading,
    textInputRef,
    handleChange,
    handleSignIn,
  };
};
