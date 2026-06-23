import { useCallback, useState } from "react";
import { Keyboard } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { useVerifyOtpMutation } from "@/redux/features/authSlice";
import { RootState } from "@/types/global";
import { persistAuthAndNavigate } from "@/utils/completeLogin";

interface VerifyPasswordHook {
  isLoading: boolean;
  errorState: string;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  dismissKeyboard: () => void;
  resetInput: () => void;
  userAlreadyRegistered: string | undefined;
  handleVerifyPassword: (passwordValue: string) => void;
  setErrorState: React.Dispatch<React.SetStateAction<string>>;
  mobileNumber: string | undefined;
  guestLogin: () => void;
}

const useVerifyPassword = (): VerifyPasswordHook => {
  const saveAuthDataState = useSelector(
    (state: RootState) => state?.auth?.saveAuthData,
  );

  const [errorState, setErrorState] = useState<string>("");
  const [password, setPassword] = useState<string>("");
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
    setPassword("");
    setErrorState("");
  }, []);

  const validatePassword = useCallback((passwordValue: string): string => {
    if (!passwordValue || passwordValue.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return "";
  }, []);

  const handleVerifyPassword = useCallback(
    async (passwordValue: string) => {
      const validationError = validatePassword(passwordValue);
      if (validationError) {
        setErrorState(validationError);
        return;
      }

      try {
        const result = await verifyOtp({
          mobileNumber: mobileNumber || "",
          password: passwordValue,
        }).unwrap();
        await completeLogin(result);
      } catch {
        setErrorState("Incorrect password");
      }
    },
    [mobileNumber, validatePassword, verifyOtp, completeLogin],
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
    password,
    setPassword,
    dismissKeyboard,
    resetInput,
    userAlreadyRegistered,
    handleVerifyPassword,
    setErrorState,
    mobileNumber,
    guestLogin,
  };
};

export default useVerifyPassword;
