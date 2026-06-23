import { useCallback, useRef, useState } from "react";
import { Keyboard } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { useVerifyOtpMutation } from "@/redux/features/authSlice";
import { numberOfInputs } from "@/screens/verifyOtp/util";
import { RootState } from "@/types/global";
import { persistAuthAndNavigate } from "@/utils/completeLogin";

interface VerifyOtpHook {
  isLoading: boolean;
  errorState: string;
  inputValues: string[];
  setInputValues: React.Dispatch<React.SetStateAction<string[]>>;
  inputRef: React.MutableRefObject<{
    resetCurrentInputIndex: () => void;
    resetInput: () => void;
  } | null>;
  dismissKeyboard: () => void;
  resetInput: () => void;
  userAlreadyRegistered: string | undefined;
  handleVerifyOtp: () => void;
  setErrorState: React.Dispatch<React.SetStateAction<string>>;
  mobileNumber: string | undefined;
}

const useVerifyOtp = (): VerifyOtpHook => {
  const saveAuthDataState = useSelector(
    (state: RootState) => state?.auth?.saveAuthData,
  );
  const [errorState, setErrorState] = useState<string>("");
  const [isCompletingLogin, setIsCompletingLogin] = useState(false);
  const [inputValues, setInputValues] = useState<string[]>(
    Array(numberOfInputs).fill(""),
  );
  const inputRef = useRef<{
    resetCurrentInputIndex: () => void;
    resetInput: () => void;
  } | null>(null);
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
    inputRef?.current?.resetCurrentInputIndex();
  }, []);

  const resetInput = useCallback(() => {
    inputRef.current?.resetInput();
    setErrorState("");
  }, []);

  const validateOtp = useCallback((otp: string | undefined): string => {
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return "Please enter a valid OTP containing 6 digits";
    }
    return "";
  }, []);

  const handleVerifyOtp = useCallback(async () => {
    const otp = inputValues.join("");
    const validationError = validateOtp(otp);
    if (validationError) {
      setErrorState(validationError);
      return;
    }

    try {
      const result = await verifyOtp({
        mobileNumber: mobileNumber || "",
        otp,
      }).unwrap();
      await completeLogin(result);
    } catch {
      setErrorState("Incorrect OTP. Please try again.");
    }
  }, [inputValues, mobileNumber, validateOtp, verifyOtp, completeLogin]);

  return {
    isLoading: saveAuthDataState?.isLoading || isLoading || isCompletingLogin,
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
  };
};

export default useVerifyOtp;
