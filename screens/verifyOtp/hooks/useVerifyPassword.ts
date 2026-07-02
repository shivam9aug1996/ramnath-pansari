import { useCallback, useState } from "react";
import { Keyboard } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { useVerifyOtpMutation } from "@/redux/features/authSlice";
import { RootState } from "@/types/global";
import { persistAuthAndNavigate } from "@/utils/completeLogin";
import {
  ADMIN_LOGIN_MOBILE,
  DRIVER_LOGIN_MOBILE,
} from "@/constants/AuthLogin";

interface VerifyPasswordHook {
  isLoading: boolean;
  errorState: string;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  otp: string;
  setOtp: React.Dispatch<React.SetStateAction<string>>;
  isAdminLogin: boolean;
  isDriverLogin: boolean;
  requiresEmailOtp: boolean;
  otpSentTo: string | undefined;
  dismissKeyboard: () => void;
  resetInput: () => void;
  userAlreadyRegistered: string | undefined;
  handleVerifyPassword: (passwordValue: string) => void;
  setErrorState: React.Dispatch<React.SetStateAction<string>>;
  mobileNumber: string | undefined;
  guestLogin: () => void;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { error?: string; message?: string } }).data;
    return data?.error || data?.message || fallback;
  }
  return fallback;
}

const useVerifyPassword = (): VerifyPasswordHook => {
  const saveAuthDataState = useSelector(
    (state: RootState) => state?.auth?.saveAuthData,
  );

  const [errorState, setErrorState] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [isCompletingLogin, setIsCompletingLogin] = useState(false);

  const { mobileNumber, userAlreadyRegistered, requiresEmailOtp, otpSentTo, loginRole } =
    useLocalSearchParams<{
      mobileNumber?: string;
      userAlreadyRegistered?: string;
      requiresEmailOtp?: string;
      otpSentTo?: string;
      loginRole?: string;
    }>();
  const requiresEmailOtpLogin = requiresEmailOtp === "true";
  const isAdminLogin =
    loginRole === "admin" || mobileNumber === ADMIN_LOGIN_MOBILE;
  const isDriverLogin =
    loginRole === "driver" || mobileNumber === DRIVER_LOGIN_MOBILE;
  const dispatch = useDispatch();

  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();

  const completeLogin = useCallback(
    async (payload: {
      token: string;
      userData?: {
        name?: string;
        isAdminUser?: boolean;
        isDriverUser?: boolean;
        driverId?: string;
      };
    }) => {
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
    setOtp("");
    setErrorState("");
  }, []);

  const validatePassword = useCallback((passwordValue: string): string => {
    if (!passwordValue || passwordValue.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return "";
  }, []);

  const validateOtp = useCallback((otpValue: string): string => {
    if (!otpValue || otpValue.length !== 6) {
      return "Please enter the 6-digit OTP sent to your email";
    }
    return "";
  }, []);

  const handleVerifyPassword = useCallback(
    async (passwordValue: string) => {
      const passwordError = validatePassword(passwordValue);
      if (passwordError) {
        setErrorState(passwordError);
        return;
      }

      if (requiresEmailOtpLogin) {
        const otpError = validateOtp(otp);
        if (otpError) {
          setErrorState(otpError);
          return;
        }
      }

      try {
        const result = await verifyOtp({
          mobileNumber: mobileNumber || "",
          password: passwordValue,
          ...(requiresEmailOtpLogin ? { otp } : {}),
        }).unwrap();
        await completeLogin(result);
      } catch (error) {
        setErrorState(
          getApiErrorMessage(error, "Incorrect password"),
        );
      }
    },
    [
      mobileNumber,
      otp,
      requiresEmailOtpLogin,
      validatePassword,
      validateOtp,
      verifyOtp,
      completeLogin,
    ],
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
    otp,
    setOtp,
    isAdminLogin,
    isDriverLogin,
    requiresEmailOtp: requiresEmailOtpLogin,
    otpSentTo,
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
