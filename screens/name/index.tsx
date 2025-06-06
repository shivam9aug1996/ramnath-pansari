import { Keyboard, StyleSheet, TouchableWithoutFeedback } from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { useNavigation } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import Button from "@/components/Button";
import CustomTextInput from "../../components/CustomTextInput";
import {
  clearAuthData,
  useUpdateProfileMutation,
} from "@/redux/features/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import BottomSheet from "@/components/BottomSheet";
import StaticContent from "@/components/StaticContent";
import SuccessView from "../verifyOtp/SuccessView";
import { validateName } from "./utils";

const Name = () => {
  const userData = useSelector((state: RootState) => state?.auth?.userData);
  const navigation = useNavigation();
  const dispatch = useDispatch<any>();
  const [name, setName] = useState("");
  const [errorState, setErrorState] = useState("");
  const textInputRef = useRef<any>(null);
  const [updateProfile, { isLoading, isSuccess }] = useUpdateProfileMutation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!userData) {
        return;
      }
      e.preventDefault();
    });
    return unsubscribe;
  }, [navigation, userData]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleChange = useCallback(
    (value: string) => {
      if (errorState) {
        setErrorState("");
      }
      setName(value);
    },
    [errorState]
  );

  return (
    <>
      <ScreenSafeWrapper showBackButton={false}>
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ThemedView style={styles.container}>
            <ThemedText style={{ marginBottom: 60 }} type="title">
              {"What's Your\nName?"}
            </ThemedText>

            <CustomTextInput
              value={name}
              onChangeText={handleChange}
              textInputRef={textInputRef}
              type={"name"}
            />
            {errorState && (
              <ThemedText
                lightColor={Colors.light.lightRed}
                style={styles.errorText}
              >
                {errorState}
              </ThemedText>
            )}

            <Button
              title="Continue"
              isLoading={isLoading}
              onPress={() => {
                const validationError = validateName(name);
                if (validationError) {
                  setErrorState(validationError);
                } else if (!userData?._id) {
                  dispatch(clearAuthData());
                } else {
                  const formRes = new FormData();
                  formRes.append("name", name);
                  formRes.append("_id", userData?._id);
                  updateProfile(formRes);
                }
              }}
            />
          </ThemedView>
        </TouchableWithoutFeedback>
      </ScreenSafeWrapper>
      {isSuccess && (
        <BottomSheet staticContent={<StaticContent />}>
          <SuccessView />
        </BottomSheet>
      )}
    </>
  );
};

export default Name;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 55,
  },
  errorText: {
    marginTop: 8,
  },
});
