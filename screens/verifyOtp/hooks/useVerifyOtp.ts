import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { useVerifyOtpMutation, saveAuthData } from "@/redux/features/authSlice";
import { numberOfInputs } from "@/screens/verifyOtp/util";
import { router, useRouter } from "expo-router";
import { RootState } from "@/types/global";

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
interface RouteParams {
  mobileNumber?: string;
  userAlreadyRegistered?: string;
}

const useVerifyOtp = (): VerifyOtpHook => {
  const saveAuthDataState = useSelector(
    (state: RootState) => state?.auth?.saveAuthData
  );
  const [errorState, setErrorState] = useState<string>("");
  const [inputValues, setInputValues] = useState<string[]>(
    Array(numberOfInputs).fill("")
  );
  const inputRef = useRef<{
    resetCurrentInputIndex: () => void;
    resetInput: () => void;
  } | null>(null);
  const route = useRoute();

  const dispatch = useDispatch();
  const { mobileNumber, userAlreadyRegistered }: RouteParams =
    route.params as RouteParams;

  const [verifyOtp, { isLoading, isSuccess, data }] = useVerifyOtpMutation();

  useEffect(() => {
    if (isSuccess) {
      dispatch(saveAuthData(data) as any);
    }
  }, [isSuccess]);

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

  const handleVerifyOtp = useCallback(() => {
    const otp = inputValues.join("");
    const validationError = validateOtp(otp);
    if (validationError) {
      setErrorState(validationError);
    } else {
      verifyOtp({
        mobileNumber: mobileNumber || "",
        otp,
      });
    }
  }, [inputValues, mobileNumber, validateOtp, verifyOtp]);

  return {
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
  };
};

export default useVerifyOtp;
