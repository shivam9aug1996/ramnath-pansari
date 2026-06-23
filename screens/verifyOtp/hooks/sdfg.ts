import { useCallback, useState } from "react";
import { Keyboard } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { useVerifyOtpMutation } from "@/redux/features/authSlice";
import { RootState } from "@/types/global";
import { persistAuthAndNavigate } from "@/utils/completeLogin";

interface VerifyOtpHook {
  isLoading: boolean;
  errorState: string;
  otp: string;
  setOtp: React.Dispatch<React.SetStateAction<string>>;
  dismissKeyboard: () => void;
  resetInput: () => void;
  userAlreadyRegistered: string | undefined;
  handleVerifyOtp: (otpValue: string) => void;
  setErrorState: React.Dispatch<React.SetStateAction<string>>;
  mobileNumber: string | undefined;
  guestLogin: () => void;
}

const useVerifyOtp1 = (): VerifyOtpHook => {
  const saveAuthDataState = useSelector(
    (state: RootState) => state?.auth?.saveAuthData,
  );

  const [errorState, setErrorState] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [isCompletingLogin, setIsCompletingLogin] = useState(false);

  const { mobileNumber, userAlreadyRegistered } = useLocalSearchParams<{
    mobileNumber?: string;
    userAlreadyRegistered?: string;
  }>();
  const dispatch = useDispatch();

  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();

  const completeLogin = useCallback(
    async (payload: { token: string; userData?: { name?: string; isAdminUser?: boolean } }) => {
      setIsCompletingLogin(true);
      try {
        await persistAuthAndNavigate(dispatch, payload);
      } catch {
        setErrorState("Failed to save login session. Please try again.");
      } finally {
        setIsCompletingLogin(false);
      }
    },
    [dispatch],
  );

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const resetInput = useCallback(() => {
    setOtp("");
    setErrorState("");
  }, []);

  const validateOtp = useCallback((otpValue: string): string => {
    if (!otpValue || otpValue.length !== 6 || !/^\d{6}$/.test(otpValue)) {
      return "Please enter a valid OTP containing 6 digits";
    }
    return "";
  }, []);

  const handleVerifyOtp = useCallback(
    async (otpValue: string) => {
      const validationError = validateOtp(otpValue);
      if (validationError) {
        setErrorState(validationError);
        return;
      }

      try {
        const result = await verifyOtp({
          mobileNumber: mobileNumber || "",
          otp: otpValue,
        }).unwrap();
        await completeLogin(result);
      } catch {
        setErrorState("Incorrect OTP. Please try again.");
      }
    },
    [mobileNumber, validateOtp, verifyOtp, completeLogin],
  );

  const guestLogin = useCallback(async () => {
    try {
      const result = await verifyOtp({ isGuestUser: true }).unwrap();
      await completeLogin(result);
    } catch {
      setErrorState("Guest login failed. Please try again.");
    }
  }, [verifyOtp, completeLogin]);

  return {
    isLoading: saveAuthDataState?.isLoading || isLoading || isCompletingLogin,
    errorState,
    otp,
    setOtp,
    dismissKeyboard,
    resetInput,
    userAlreadyRegistered,
    handleVerifyOtp,
    setErrorState,
    mobileNumber,
    guestLogin,
  };
};

export default useVerifyOtp1;
