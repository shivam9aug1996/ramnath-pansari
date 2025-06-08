import { useCallback, useEffect, useState } from "react";
import { Keyboard } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { useVerifyOtpMutation, saveAuthData } from "@/redux/features/authSlice";
import { router } from "expo-router";
import { RootState } from "@/types/global";

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
}

interface RouteParams {
  mobileNumber?: string;
  userAlreadyRegistered?: string;
}

const useVerifyOtp1 = (): VerifyOtpHook => {
  const saveAuthDataState = useSelector(
    (state: RootState) => state?.auth?.saveAuthData
  );

  const [errorState, setErrorState] = useState<string>("");
  const [otp, setOtp] = useState<string>("");

  const route = useRoute();
  const dispatch = useDispatch();

  const { mobileNumber, userAlreadyRegistered }: RouteParams =
    route.params as RouteParams;

  const [verifyOtp, { isLoading, isSuccess, data }] = useVerifyOtpMutation();

  // Save auth data when OTP is successfully verified
  useEffect(() => {
    if (isSuccess) {
      dispatch(saveAuthData(data) as any);
    }
  }, [isSuccess]);

  // Navigate user after auth is saved
  useEffect(() => {
    if (saveAuthDataState?.isSuccess) {
      if (data) {
        if (data?.userData?.name) {
          router.replace("/(private)/(tabs)/home");
        } else {
          router.replace("/name");
        }
      }
    }
  }, [saveAuthDataState?.isSuccess, data]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const resetInput = useCallback(() => {
    setOtp("");
    setErrorState("");
  }, []);

  const validateOtp = useCallback((otpValue: string): string => {
    //console.log("otpValue", otpValue, !/^\d{6}$/.test(otpValue));
    if (!otpValue || otpValue.length !== 6 || !/^\d{6}$/.test(otpValue)) {
      return "Please enter a valid OTP containing 6 digits";
    }
    return "";
  }, []);

  const handleVerifyOtp = useCallback(
    (otpValue: string) => {
      const validationError = validateOtp(otpValue);
     // console.log("validationError", validationError);
      if (validationError) {
        setErrorState(validationError);
      } else {
       // console.log("otp hit", otpValue,mobileNumber);
        verifyOtp({
          mobileNumber: mobileNumber || "",
          otp: otpValue,
        });
      }
    },
    [mobileNumber, validateOtp, verifyOtp]
  );

  return {
    isLoading,
    errorState,
    otp,
    setOtp,
    dismissKeyboard,
    resetInput,
    userAlreadyRegistered,
    handleVerifyOtp,
    setErrorState,
    mobileNumber,
  };
};

export default useVerifyOtp1;
