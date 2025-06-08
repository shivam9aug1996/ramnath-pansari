import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  View,
  LayoutChangeEvent,
  ScrollView,
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
import { router, useLocalSearchParams } from "expo-router";
import DeferredFadeIn from "@/components/DeferredFadeIn";
import { showToast } from "@/utils/utils";

// Define the types for form fields and validation rules
interface Field {
  key: keyof FormState;
  label: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  prefix?: string;
  keyboardType?: "default" | "phone-pad";
  maxLength?: number;
}

// Define the form state and error state types
interface FormState {
  name: string;
  phone: string;
  city: string;
  state: string;
  pincode: string;
  buildingName: string;
  colonyArea: string;
  latitude: string;
  longitude: string;
}

interface ErrorState {
  name: string;
  phone: string;
  city: string;
  state: string;
  pincode: string;
  buildingName: string;
  colonyArea: string;
}

// Define form fields and corresponding validation rules
const fields: Field[] = [
  { key: "name", label: "Name", iconName: "person-outline", maxLength: 30 },
  {
    key: "phone",
    label: "Phone Number",
    prefix: "+91",
    keyboardType: "phone-pad",
    maxLength: 10,
  },
  { key: "buildingName", label: "H.No/Building Name" },
  { key: "colonyArea", label: "Colony/Area" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  {
    key: "pincode",
    label: "Pincode",
    keyboardType: "phone-pad",
    maxLength: 6,
    helperText: "We currently deliver to 245304 only",
  },
];

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
}

export const InputField: React.FC<InputFieldProps> = ({
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
          style={[
            styles.errorText,
            {
              marginBottom: 15,
            },
          ]}
        >
          {error}
        </ThemedText>
      )}
    </>
  );
};

const AddAddress: React.FC = () => {
  //const params = useLocalSearchParams();
  // const itemId = params?._id;

  const currentAddressData = useSelector(
    (state: RootState) => state?.address?.currentAddressData
  );
  const action = currentAddressData?.action;
  const itemId =
    currentAddressData?.action == "edit"
      ? currentAddressData?.form?._id
      : undefined;
 // console.log("765resdfghjk", JSON.stringify(currentAddressData));
  const {
    loading: fetchingLocationLoading,
    data: fetchingLocationData,
    fetchLocationData,
  } = useFetchLocation();
  const [
    createAddress,
    { isLoading: createAddressLoading, data: addressData },
  ] = useCreateAddressMutation();
  const [updateAddress, { isLoading: updateAddressLoading }] =
    useUpdateAddressMutation();
  const [fetchAddress, { isFetching: fetchingAddressLoading }] =
    useLazyFetchAddressQuery();
  const userInfo = useSelector((state: RootState) => state.auth.userData);
  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    city: "",
    state: "",
    pincode: "",
    buildingName: "",
    colonyArea: "",
    latitude: "",
    longitude: "",
  });
  const [initialForm, setInitialForm] = useState<FormState>({
    name: "",
    phone: "",
    city: "",
    state: "",
    pincode: "",
    buildingName: "",
    colonyArea: "",
    latitude: "",
    longitude: "",
  });

  const [errors, setErrors] = useState<ErrorState>({
    name: "",
    phone: "",
    city: "",
    state: "",
    pincode: "",
    buildingName: "",
    colonyArea: "",
  });

  const inputRefs = useRef<{
    [key in keyof FormState]: React.RefObject<TextInput>;
  }>({
    name: React.createRef(),
    phone: React.createRef(),
    city: React.createRef(),
    state: React.createRef(),
    pincode: React.createRef(),
    buildingName: React.createRef(),
    colonyArea: React.createRef(),
    latitude: React.createRef(),
    longitude: React.createRef(),
  });

  const scrollViewRef = useRef<ScrollView>(null);
  const inputLayouts = useRef<{ [key in keyof FormState]?: { y: number } }>({});

  useEffect(() => {
    if (fetchingLocationData) {
      const { city, area, pincode, state, latitude, longitude } =
        fetchingLocationData;
      setForm({
        ...form,
        colonyArea: area,
        city: city,
        pincode: pincode,
        state: state,
        latitude: latitude,
        longitude: longitude,
      });
    }
  }, [fetchingLocationData]);

  // useEffect(() => {
  //   if (itemId) {
  //     setForm({
  //       ...form,
  //       ...params,
  //     });
  //     setInitialForm(params);
  //     setErrors((prev) => ({
  //       ...prev,
  //       buildingName: "",
  //       city: "",
  //       colonyArea: "",
  //       name: "",
  //       phone: "",
  //       pincode: "",
  //       state: "",
  //     }));
  //   }
  // }, [itemId]);

  useEffect(() => {
    if (action == "add" || action == "edit") {
      let obj = {
        ...form,
        ...currentAddressData?.form,
      };
      delete obj?.area;
      delete obj?.query;
      delete obj?.action;
      setForm(obj);

      let obj2 = {
        ...form,
        ...currentAddressData?.initialForm,
      };
      delete obj2?.area;
      delete obj2?.query;
      delete obj2?.action;

      setInitialForm(obj2);
      setErrors((prev) => ({
        ...prev,
        buildingName: "",
        city: "",
        colonyArea: "",
        name: "",
        phone: "",
        pincode: "",
        state: "",
      }));
    }
  }, [action]);

  const handleChange = useCallback(
    (key: keyof FormState) => (value: string) => {
      setErrors((prev) => ({ ...prev, [key]: "" }));
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );
  // console.log("hgfdfghjk", form);
  // console.log("hgfdfghjkinitak", initialForm, itemId);

  const handleInputLayout =
    (key: keyof FormState) => (event: LayoutChangeEvent) => {
      inputLayouts.current[key] = event.nativeEvent.layout;
    };

  const scrollToField = (field: keyof FormState) => {
    const layout = inputLayouts.current[field];
    if (layout && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: layout.y - 10, animated: true });
    }
  };

  const validateForm = useCallback(() => {
    let valid = true;
    const newErrors: ErrorState = { ...errors };
    //console.log("uytfghjk", form);
    if (!form.name.trim()) {
      newErrors.name = "Name is required";
      scrollToField("name");
      valid = false;
    } else if (!/^\d{10}$/.test(form.phone.trim())) {
      newErrors.phone = "Invalid phone number";
      scrollToField("phone");
      valid = false;
    } else if (!form.city.trim()) {
      newErrors.city = "City is required";
      scrollToField("city");
      valid = false;
    } else if (!form.state.trim()) {
      newErrors.state = "State is required";
      scrollToField("state");
      valid = false;
    } else if (!/^\d{6}$/.test(form.pincode.trim())) {
      newErrors.pincode = "Invalid pincode";
      scrollToField("pincode");
      valid = false;
    } else if (!form.buildingName.trim()) {
      newErrors.buildingName = "Building name is required";
      scrollToField("buildingName");
      valid = false;
    } else if (!form.colonyArea.trim()) {
      newErrors.colonyArea = "Colony/Area is required";
      scrollToField("colonyArea");
      valid = false;
    }
    //console.log("o9876trfghjkl");
    setErrors(newErrors);
    return valid;
  }, [form, errors]);

  const changeInFields = () => {
    for (const key in form) {
      if (
        form[key as keyof FormState] !== initialForm[key as keyof FormState]
      ) {
        //console.log(form[key], initialForm[key]);
        return true;
      }
    }
    return false;
  };

  const handleSave = async () => {
    if(form.latitude == "" || form.longitude == ""){
      showToast({
        text2: "Please tap on Get current location button.",
        type: "error",
      });
      return
      
    }
    try {
      if (validateForm()) {
        if (changeInFields()) {
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
        }
        router.dismissTo("/(address)/addressList");

        //router.dismissTo("/(address)/addressList");
        // router.navigate({
        //   pathname: "/(address)/addressList",
        // });
      }
    } catch (error) {}
    //console.log("kjht567890-", form);
    //router.navigate("/(address)/mapSelect");
  };

  return (
    <ScreenSafeWrapper
      title={`${itemId ? "Edit" : "Add"} delivery address`}
      useKeyboardAvoidingView={true}
    >
      <DeferredFadeIn delay={100} style={{ flexShrink: 0, flex: 1 }}>
        <ScrollView
          bounces={Platform.OS === "android" ? false : true}
          ref={scrollViewRef}
          style={{ flex: 1, paddingTop: 10, marginTop: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView style={styles.container}>
            {fields.map((field) => (
              <View key={field.key} onLayout={handleInputLayout(field.key)}>
                {field.key === "colonyArea" ? (
                  <FetchLocation
                    loading={fetchingLocationLoading}
                    onPress={() => {
                      setErrors((prev) => ({
                        ...prev,
                        city: "",
                        state: "",
                        pincode: "",
                        colonyArea: "",
                      }));
                      fetchLocationData();
                    }}
                  />
                ) : null}
                {field.key === "name" ? (
                  <FetchUserInfo
                    onPress={() => {
                      setForm({
                        ...form,
                        name: userInfo?.name || "",
                        phone: userInfo?.mobileNumber || "",
                      });
                      setErrors((prev) => ({ ...prev, name: "", phone: "" }));
                    }}
                  />
                ) : null}
                <InputField
                  label={field.label}
                  value={form[field.key]}
                  onChange={handleChange(field.key)}
                  error={errors[field.key]}
                  iconName={field.iconName}
                  prefix={field.prefix}
                  keyboardType={field.keyboardType}
                  maxLength={field.maxLength}
                  customRef={inputRefs.current[field.key]}
                  multiLine={field?.key == "colonyArea" ? true : false}
                  helperText={field?.helperText}
                />
              </View>
            ))}
          </ThemedView>
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
        </ScrollView>
      </DeferredFadeIn>
    </ScreenSafeWrapper>
  );
};

export default AddAddress;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorText: {
    marginTop: 4,
  },
  label: {
    marginBottom: 10,
    color: Colors.light.mediumLightGrey,
  },
  inputContainer: {
    width: "100%",
    borderRadius: 20,
    paddingVertical: 20,
    position: "relative",
    backgroundColor: "#f2f4f3",
  },
  prefix: {
    ...(fonts.defaultNumber as any),
    position: "absolute",
    fontSize: 16,
    paddingHorizontal: 20,
    top: Platform.OS === "android" ? 23 : 19,
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
    backgroundColor: "#e0e0e0", // Lighter background to indicate non-editable
  },
  helperText: {
    marginBottom: 15,
    fontSize: 13,
    fontFamily: "Montserrat_500Medium",
  },
});
