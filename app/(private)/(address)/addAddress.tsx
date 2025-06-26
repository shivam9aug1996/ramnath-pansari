import React, { memo, useCallback, useEffect, useRef, useState } from "react";
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
import { useSelector } from "react-redux";
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
import WebMap from "./WebMap";
import WebMapRenderer from "./WebMapRenderer";

interface FormState {
  name: string;
  phone: string;
  address: string;
  latitude: string;
  longitude: string;
}

interface InputFieldProps {
  label: string;
  value: string;
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
}

export const InputField: React.FC<InputFieldProps> = memo(
  ({
    label,
    value,
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
  }) => {
    const handlePress = () => customRef?.current?.focus();

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
            value={value}
            onChangeText={onChange}
            style={[styles.textInput, { left: !prefix && !iconName ? 25 : 60 }]}
            keyboardType={keyboardType}
            maxLength={maxLength}
            multiline={multiLine}
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

const AddAddress: React.FC = () => {
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

  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    address: "",
    latitude: "",
    longitude: "",
  });

  const [errors, setErrors] = useState<FormState>({
    name: "",
    phone: "",
    address: "",
    latitude: "",
    longitude: "",
  });

  const nameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      if (action === "add" || action === "edit") {
        const formData = {
          ...form,
          ...currentAddressData?.form,
        };
        delete formData?.area;
        delete formData?.query;
        delete formData?.action;
        setForm(formData);

        setErrors({
          name: "",
          phone: "",
          address: "",
          latitude: "",
          longitude: "",
        });
      }
    }, [currentAddressData]) // run whenever form changes
  );

  const { isWithin, distance } =
    form?.latitude && form?.longitude
      ? isWithinDeliveryRadius({
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
        })
      : { isWithin: false, distance: 0 };

  const handleChange = (key: keyof FormState) => (value: string) => {
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    let valid = true;
    const newErrors: FormState = { ...errors };

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    } else if (!/^\d{10}$/.test(form.phone.trim())) {
      newErrors.phone = "Invalid phone number";
      valid = false;
    } else if (!form.address.trim()) {
      newErrors.address = "Address is required";
      valid = false;
    } else if (!form.latitude) {
      newErrors.latitude = "Latitude is required";
      valid = false;
    } else if (!form.longitude) {
      newErrors.longitude = "Longitude is required";
      valid = false;
    }
    // else if(!isWithin) {
    //   newErrors.address = "You're just outside our 3 km delivery zone.";
    //   valid = false;
    // }
    //console.log("newErr67890ors",newErrors,form,isWithinDeliveryRadius({latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude)})?.isWithin)
    // return false;

    setErrors(newErrors);

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
                ...form,
              },
              addressId: itemId,
            },
          })?.unwrap();
        } else {
          console.log("4567876544567890", {
            userId: userInfo?._id,
            address: {
              ...form,
            },
          });
          await createAddress({
            body: {
              userId: userInfo?._id,
              address: {
                ...form,
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

  return (
    <ScreenSafeWrapper
      title={`${itemId ? "Edit" : "Add"} delivery address`}
      useKeyboardAvoidingView={true}
    >
      {/* <WebMapRenderer visible={false} latitude={form.latitude} longitude={form.longitude} /> */}
      <DeferredFadeIn delay={100} style={{ flexShrink: 0, flex: 1 }}>
        <ScrollView
          bounces={Platform.OS === "android" ? false : true}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView style={styles.container}>
            {!userInfo?.isGuestUser && (
              <FetchUserInfo
                onPress={() => {
                  setForm((prev) => ({
                    ...prev,
                    name: userInfo?.name || "",
                    phone: userInfo?.mobileNumber || "",
                  }));
                  setErrors((prev) => ({ ...prev, name: "", phone: "" }));
                }}
              />
            )}

            <InputField
              label="Name"
              value={form.name}
              onChange={handleChange("name")}
              error={errors.name}
              iconName="person-outline"
              maxLength={30}
              customRef={nameRef}
            />

            <InputField
              label="Phone Number"
              value={form.phone}
              onChange={handleChange("phone")}
              error={errors.phone}
              prefix="+91"
              keyboardType="phone-pad"
              maxLength={10}
              customRef={phoneRef}
            />

            <FetchLocation
              title="Set Location on Map"
              loading={false}
              onPress={() => {
                Keyboard.dismiss()
                router.push({
                  pathname: "/(address)/WebMap",
                  params: {
                    latitude: form.latitude,
                    longitude: form.longitude,
                  },
                });
              }}
            />

            <InputField
              label="Address"
              value={form.address}
              onChange={handleChange("address")}
              error={errors.address}
              iconName="location-outline"
              customRef={addressRef}
              multiLine={true}
              // helperText={form?.address ? !isWithin
              //   ? `We're sorry, but you're ${distance} km away from our delivery zone. We currently deliver within a 3 km radius.`
              //   : `Great news! You're ${distance} km away and well within our 3 km delivery zone.` : ""}
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
