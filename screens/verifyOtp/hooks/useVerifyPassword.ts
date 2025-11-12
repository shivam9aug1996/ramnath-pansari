import { useCallback, useEffect, useState } from "react";
import { Keyboard } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { useVerifyOtpMutation, saveAuthData, savePushTokenToStorage } from "@/redux/features/authSlice";
import { router } from "expo-router";
import { RootState } from "@/types/global";

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

interface RouteParams {
  mobileNumber?: string;
  userAlreadyRegistered?: string;
}

const useVerifyPassword = (): VerifyPasswordHook => {
  const saveAuthDataState = useSelector(
    (state: RootState) => state?.auth?.saveAuthData
  );

  const [errorState, setErrorState] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const route = useRoute();
  const dispatch = useDispatch();

  const { mobileNumber, userAlreadyRegistered }: RouteParams =
    route.params as RouteParams;

  const [verifyOtp, { isLoading, isSuccess, data }] = useVerifyOtpMutation();

  // Save auth data when password is successfully verified
  useEffect(() => {
    if (isSuccess) {
      console.log("iuytresghjhgfdsfghj",data)
      dispatch(saveAuthData(data) as any);
      // dispatch(savePushTokenToStorage("loaded") as any);
    }
  }, [isSuccess]);

  // Navigate user after auth is saved
  useEffect(() => {
    if (saveAuthDataState?.isSuccess) {
      if (data) {
        if (data?.userData?.name) {
          if(data?.userData?.isAdminUser){
            router.replace("/admin/home");
          }else{
            router.replace("/(private)/(tabs)/home");
          } 
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
    setPassword("");
    setErrorState("");
  }, []);

  const validatePassword = useCallback((passwordValue: string): string => {
    console.log("passwordValue", passwordValue);
    if (!passwordValue || passwordValue.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return "";
  }, []);

  const handleVerifyPassword = useCallback(
    (passwordValue: string) => {
      const validationError = validatePassword(passwordValue);
      if (validationError) {
        setErrorState(validationError);
      } else {
        verifyOtp({
          mobileNumber: mobileNumber || "",
          password: passwordValue,
        });
      }
    },
    [mobileNumber, validatePassword, verifyOtp]
  );

  const guestLogin = useCallback(() => {
    verifyOtp({
      isGuestUser: true,
    });
  }, []);

  return {
    isLoading:saveAuthDataState?.isLoading || isLoading,
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