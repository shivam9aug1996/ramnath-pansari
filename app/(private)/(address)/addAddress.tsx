import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  View,
  LayoutChangeEvent,
  ScrollView,
  Keyboard,
} from "react-native";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { fonts } from "@/constants/Fonts";
import Button from "@/components/Button";
import FetchLocation from "./FetchLocation";
import useFetchLocation from "./useFetchLocation";
import FetchUserInfo from "./FetchUserInfo";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import {
  useCreateAddressMutation,
  useLazyFetchAddressQuery,
  useUpdateAddressMutation,
} from "@/redux/features/addressSlice";
import { router, useFocusEffect } from "expo-router";
import DeferredFadeIn from "@/components/DeferredFadeIn";
import { showToast } from "@/utils/utils";
import isWithinDeliveryRadius from "./utils";
import { setCurrentAddressData } from "@/redux/features/addressSlice";
import GenericFetchButton from "./GenericFetchButton";

interface FormState {
  name: string;
  phone: string;
  address: string;
  latitude: string;
  longitude: string;
}

interface InputFieldProps {
  label: string;
  onChange: (value: string) => void;
  error: string;
  keyboardType?: "default" | "phone-pad";
  iconName?: keyof typeof Ionicons.glyphMap;
  prefix?: string;
  maxLength?: number;
  customRef?: React.RefObject<TextInput>;
  readOnly?: boolean;
  multiLine?: boolean;
  helperText?: string;
  defaultValue?: string;
  onBlur?: () => void;
}

export const InputField: React.FC<InputFieldProps> = memo(
  ({
    label,
    onChange,
    error,
    keyboardType = "default",
    iconName,
    prefix,
    maxLength,
    customRef,
    readOnly = false,
    multiLine = false,
    helperText = "",
    defaultValue = "",
    onBlur,
  }) => {
    const handlePress = () => customRef?.current?.focus();
    console.log("InputField---------->", defaultValue, label);

    return (
      <>
        <ThemedText style={styles.label}>{label}</ThemedText>
        <Pressable
          onPress={handlePress}
          style={[
            styles.inputContainer,
            {
              marginBottom: error ? 0 : 20,
            },
            readOnly && styles.inputContainerReadOnly,
          ]}
        >
          {iconName && (
            <Ionicons
              style={[styles.prefix, styles.iconStyle]}
              name={iconName}
              size={20}
            />
          )}
          {prefix && <ThemedText style={styles.prefix}>{prefix}</ThemedText>}
          <TextInput
            readOnly={readOnly}
            ref={customRef}
            // value={value}
            defaultValue={defaultValue}
            onChangeText={onChange}
            style={[styles.textInput, { left: !prefix && !iconName ? 25 : 60 }]}
            keyboardType={keyboardType}
            maxLength={maxLength}
            multiline={multiLine}
            onBlur={onBlur}
          />
        </Pressable>
        {!error && helperText && (
          <ThemedText
            style={[styles.helperText]}
            lightColor={Colors.light.mediumLightGrey}
          >
            {helperText}
          </ThemedText>
        )}
        {error && (
          <ThemedText
            lightColor={Colors.light.lightRed}
            style={[styles.errorText, { marginBottom: 15 }]}
          >
            {error}
          </ThemedText>
        )}
      </>
    );
  }
);

function areEqual(prevProps: any, nextProps: any) {
  return (
    // prevProps.defaultValue === nextProps.defaultValue &&
    prevProps.error === nextProps.error &&
    prevProps.label === nextProps.label &&
    prevProps.helperText === nextProps.helperText
    //&&
    // prevProps.onChange === nextProps.onChange
  );
}

const AddAddress: React.FC = () => {
  const dispatch = useDispatch();
  const currentAddressData = useSelector(
    (state: RootState) => state?.address?.currentAddressData
  );
  const [isMapVisible, setIsMapVisible] = useState(false);
  const action = currentAddressData?.action;
  const itemId =
    currentAddressData?.action === "edit"
      ? currentAddressData?.form?._id
      : undefined;

  const [createAddress, { isLoading: createAddressLoading }] =
    useCreateAddressMutation();
  const [updateAddress, { isLoading: updateAddressLoading }] =
    useUpdateAddressMutation();
  const [fetchAddress, { isFetching: fetchingAddressLoading }] =
    useLazyFetchAddressQuery();
  const userInfo = useSelector((state: RootState) => state.auth.userData);

  // Use refs for form data to prevent re-renders
  const formRef = useRef<FormState>({
    name: "",
    phone: "",
    address: "",
    latitude: "",
    longitude: "",
  });

  // Use refs for errors instead of state
  const errorsRef = useRef<FormState>({
    name: "",
    phone: "",
    address: "",
    latitude: "",
    longitude: "",
  });

  // Add a state to force re-render when needed (for display purposes)
  const [, forceUpdate] = useState({});

  const nameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      if (action === "add" || action === "edit") {
        const formData = {
          ...formRef.current,
          ...currentAddressData?.form,
        };
        delete formData?.area;
        delete formData?.query;
        delete formData?.action;
        formRef.current = formData;
        console.log("formRef34567890", formData);
        forceUpdate({}); // Force re-render to update UI

        // Clear errors using ref
        errorsRef.current = {
          name: "",
          phone: "",
          address: "",
          latitude: "",
          longitude: "",
        };
      }
    }, [currentAddressData])
  );

  console.log("formRef3456678907890", currentAddressData);

  const deliveryRadiusInfo = useMemo(() => {
    if (formRef.current?.latitude && formRef.current?.longitude) {
      return isWithinDeliveryRadius({
        latitude: parseFloat(formRef.current.latitude),
        longitude: parseFloat(formRef.current.longitude),
      });
    }
    return { isWithin: false, distance: 0 };
  }, [formRef.current?.latitude, formRef.current?.longitude]);

  // Memoize helper text
  const addressHelperText = useMemo(() => {
    return deliveryRadiusInfo.distance
      ? `You are ${deliveryRadiusInfo.distance} km away from our delivery zone.`
      : "";
  }, [deliveryRadiusInfo.distance]);

  const handleNameChange = useCallback((value: string) => {
    if (errorsRef.current.name) {
      errorsRef.current.name = "";
      forceUpdate({});
    }
    formRef.current.name = value;
    //forceUpdate({}); // Force re-render to update error display
  }, []);

  const handlePhoneChange = useCallback((value: string) => {
    if (errorsRef.current.phone) {
      errorsRef.current.phone = "";
      forceUpdate({});
    }
    formRef.current.phone = value;
    //forceUpdate({}); // Force re-render to update error display
  }, []);

  const handleAddressChange = useCallback((value: string) => {
    if (errorsRef.current.address) {
      errorsRef.current.address = "";
      forceUpdate({});
    }
    formRef.current.address = value;
    //forceUpdate({}); // Force re-render to update error display
  }, []);

  const validateForm = () => {
    let valid = true;
    const newErrors: FormState = { ...errorsRef.current };
    console.log("formRef---------->", formRef);

    if (!formRef.current.name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    } else if (!/^\d{10}$/.test(formRef.current.phone.trim())) {
      newErrors.phone = "Invalid phone number";
      valid = false;
    } else if (!formRef.current.address.trim()) {
      newErrors.address = "Address is required";
      valid = false;
    } else if (!formRef.current.latitude) {
      newErrors.latitude = "Please select location on map";
      valid = false;
    } else if (!formRef.current.longitude) {
      newErrors.longitude = "Please select location on map";
      valid = false;
    }

    errorsRef.current = newErrors;
    forceUpdate({}); // Force re-render to display errors
    return valid;
  };

  const handleSave = async () => {
    try {
      if (validateForm()) {
        if (itemId) {
          await updateAddress({
            body: {
              userId: userInfo?._id,
              address: {
                ...formRef.current,
              },
              addressId: itemId,
            },
          })?.unwrap();
        } else {
          await createAddress({
            body: {
              userId: userInfo?._id,
              address: {
                ...formRef.current,
              },
            },
          })?.unwrap();
        }
        await fetchAddress(
          {
            userId: userInfo?._id,
          },
          false
        )?.unwrap();
        router.dismissTo("/(address)/addressList");
      }
    } catch (error) {}
  };

  const handleSetLocation = useCallback(() => {
    Keyboard.dismiss();
    dispatch(
      setCurrentAddressData({
        ...currentAddressData,
        form: {
          ...currentAddressData?.form,
          ...formRef.current,
        },
      })
    );
    router.push({
      pathname: "/(address)/WebMap",
      params: {
        ...formRef.current,
        latitude: formRef.current.latitude,
        longitude: formRef.current.longitude,
      },
    });
  }, [dispatch, currentAddressData]);

  const handleGetUserInfo = useCallback(() => {
    formRef.current = {
      ...formRef.current,
      name: userInfo?.name || "",
      phone: userInfo?.mobileNumber || "",
    };
    errorsRef.current.name = "";
    errorsRef.current.phone = "";
    forceUpdate({}); // Force re-render to update UI
  }, [userInfo, forceUpdate]);

  return (
    <ScreenSafeWrapper
      title={`${itemId ? "Edit" : "Add"} delivery address`}
      useKeyboardAvoidingView={true}
    >
      <DeferredFadeIn delay={100} style={{ flexShrink: 0, flex: 1 }}>
        <ScrollView
          bounces={Platform.OS === "android" ? false : true}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView style={styles.container}>
            {!userInfo?.isGuestUser && (
              <GenericFetchButton
                iconName="person"
                onPress={handleGetUserInfo}
                title="Get User Info"
              />
            )}

            <InputField
              label="Name"
              defaultValue={formRef.current.name}
              onChange={handleNameChange}
              error={errorsRef.current.name}
              iconName="person-outline"
              maxLength={30}
              customRef={nameRef}
            />

            <InputField
              label="Phone Number"
              defaultValue={formRef.current.phone}
              onChange={handlePhoneChange}
              error={errorsRef.current.phone}
              prefix="+91"
              keyboardType="phone-pad"
              maxLength={10}
              customRef={phoneRef}
            />
             <GenericFetchButton
                iconName="location-sharp"
                onPress={handleSetLocation}
                title="Set Location on Map"
              />

            <InputField
              label="Address"
              defaultValue={formRef.current.address}
              onChange={handleAddressChange}
              error={
                errorsRef.current.address ||
                errorsRef.current.latitude ||
                errorsRef.current.longitude
              }
              iconName="location-outline"
              customRef={addressRef}
              multiLine={true}
              helperText={addressHelperText}
            />

            <Button
              isLoading={
                createAddressLoading ||
                updateAddressLoading ||
                fetchingAddressLoading
              }
              wrapperStyle={{
                marginTop: 10,
                marginBottom: 10,
                paddingBottom: 20,
              }}
              onPress={handleSave}
              title={itemId ? "Update Address" : "Save Address"}
            />
          </ThemedView>
        </ScrollView>
      </DeferredFadeIn>
    </ScreenSafeWrapper>
  );
};

export default AddAddress;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 20,
    marginTop: 20,
  },
  errorText: {
    marginTop: 4,
    fontFamily: "Montserrat_500Medium",
  },
  label: {
    marginBottom: 10,
    color: Colors.light.mediumLightGrey,
  },
  inputContainer: {
    width: "100%",
    borderRadius: 20,
    paddingVertical: Platform.OS === "android" ? 10 : 20,
    position: "relative",
    backgroundColor: "#f2f4f3",
  },
  prefix: {
    ...(fonts.defaultNumber as any),
    position: "absolute",
    fontSize: 16,
    paddingHorizontal: 20,
    top: Platform.OS === "android" ? 20 : 19,
  },
  textInput: {
    ...(fonts.defaultNumber as any),
    width: "75%",
    fontSize: 16,
    left: 60,
    color: Colors.light.darkGrey,
  },
  iconStyle: {
    top: Platform.OS === "android" ? 23 : 19,
    fontWeight: "900",
    fontSize: 20,
  },
  inputContainerReadOnly: {
    backgroundColor: "#e0e0e0",
  },
  helperText: {
    marginBottom: 15,
    fontSize: 13,
    fontFamily: "Montserrat_500Medium",
  },
});
