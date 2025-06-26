import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { ThemedView } from "@/components/ThemedView";
import { fonts } from "@/constants/Fonts";
import { Colors } from "@/constants/Colors";
import { InputField } from "../(address)/addAddress";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { Image } from "expo-image";
import Button from "@/components/Button";
import {
  useLazyFetchProfileQuery,
  useUpdateProfileMutation,
} from "@/redux/features/authSlice";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Feather from "@expo/vector-icons/Feather";
import CustomSuspense from "@/components/CustomSuspense";
import { showToast } from "@/utils/utils";
import useProfileStageLoad from "@/hooks/useProfileStageLoad";
import DeferredFadeIn from "@/components/DeferredFadeIn";
const fields: any = [
  { key: "name", label: "Name", iconName: "person-outline", maxLength: 30 },
  {
    key: "phone",
    label: "Phone Number",
    prefix: "+91",
    keyboardType: "phone-pad",
    maxLength: 10,
  },
  { key: "image", label: "Photo" },
];

const profile = () => {
  const userInfo = useSelector((state: RootState) => state.auth.userData);
  const [updateProfile, { isLoading: updateProfileLoading }] =
    useUpdateProfileMutation();
  const [fetchProfile, { isLoading: fetchProfileLoading }] =
    useLazyFetchProfileQuery();
  const [form, setForm] = useState<any>({
    name: "",
    phone: "",
    image: null,
  });
  const [errors, setErrors] = useState<any>({
    name: "",
    phone: "",
    image: null,
  });
  const inputRefs = useRef<{
    [key in keyof any]: React.RefObject<any>;
  }>({
    name: React.createRef(),
    phone: React.createRef(),
    image: React.createRef(),
  });
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (userInfo?._id) {
      setForm({
        ...form,
        name: userInfo?.name,
        phone: userInfo?.mobileNumber,
      });
    }
  }, [userInfo?._id]);

  const handleChange = useCallback(
    (key: keyof any) => (value: string) => {
      setErrors((prev) => ({ ...prev, [key]: "" }));
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const validateForm = useCallback(() => {
    let valid = true;
    const newErrors: any = { ...errors };

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }, [form, errors]);

  // const handleSave = async () => {
  //   if (validateForm()) {
  //     const formRes = new FormData();
  //     formRes.append("_id", userInfo?._id);
  //     formRes.append("name", form?.name);

  //     formRes.append(`images[type]`, form?.image?.mimeType);

  //     formRes.append(`images[image]`, form?.image?.base64);

  //     await updateProfile(formRes)?.unwrap();
  //     await fetchProfile({ _id: userInfo?._id }, false)?.unwrap();
  //     router.navigate("/account");
  //   }
  // };

  const handleSave = async () => {
    const formRes = new FormData();
    let hasChanges = false; // Flag to track if any changes were made
    if (form?.imageSize > 1) {
      showToast({ type: "info", text2: `Sorry this image cannot be uploaded` });
      return;
    }

    if (validateForm()) {
      // Check and append only changed values
      if (form?.name !== userInfo?.name) {
        formRes.append("name", form?.name);
        hasChanges = true; // Mark that a change has been made
      }

      // If an image was selected, append it to the form
      if (form?.image) {
        formRes.append("images[type]", form?.image?.mimeType);
        formRes.append("images[image]", form?.image?.base64);
        hasChanges = true;
      }

      // Only update profile if there are changes
      if (hasChanges) {
        formRes.append("_id", userInfo?._id);
        try {
          await updateProfile(formRes)?.unwrap();
          await fetchProfile({ _id: userInfo?._id }, false)?.unwrap();
          router.back();
        } catch (error) {
         // console.log("Error updating profile", error);
        }
      } else {
        router.back();
      }
    }
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      //aspect: [1, 1],
      quality: 0.1,
      base64: true,
    });
    let g = await ImagePicker.getPendingResultAsync();
    // console.log(result);
   // console.log("98765rfghjkl", result?.assets[0]?.fileSize);
    let fileSize = result?.assets[0]?.fileSize;
    fileSize = (fileSize / 1024 / 1024)?.toFixed(2);
    if (fileSize > 1) {
      showToast({ type: "info", text2: `Sorry this image cannot be uploaded` });
    }

    if (!result.canceled) {
      setForm({
        ...form,
        image: result.assets[0],
        imageSize: fileSize,
      });
      //setImage(result.assets[0].uri);
    }
  };

  // console.log(form?.image && Object.keys(form?.image));
  return (
    <ScreenSafeWrapper useKeyboardAvoidingView={true}>
      
       
        <DeferredFadeIn delay={100} style={{flex:1}}>
         <ScrollView
        bounces={Platform.OS === "android" ? false : true}
          ref={scrollViewRef}
          style={{ flex: 1, paddingTop: 10, marginTop: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView style={styles.container}>
            <View>
              <TouchableOpacity
                style={{
                  // backgroundColor: "red",
                  alignSelf: "center",
                  position: "relative",
                }}
                onPress={pickImage}
              >
                <Image
                  source={{
                    uri:
                      form?.image?.uri ||
                      userInfo?.profileImage ||
                      "https://static.vecteezy.com/system/resources/previews/036/594/092/non_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg",
                  }}
                  style={styles.profileImage}
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    //  backgroundColor: "green",
                    //width: "50%",
                    height: "30%",
                    alignContent: "center",
                    right: -10,
                  }}
                >
                  <Feather
                    name="edit"
                    size={20}
                    color={Colors.light.mediumGrey}
                    style={{}}
                  />
                </View>
              </TouchableOpacity>

              <InputField
                label={fields[0].label}
                value={form[fields[0].key]}
                onChange={handleChange(fields[0].key)}
                error={errors[fields[0].key]}
                iconName={fields[0].iconName}
                prefix={fields[0].prefix}
                keyboardType={fields[0].keyboardType}
                maxLength={fields[0].maxLength}
                customRef={inputRefs.current[fields[0].key]}
              />
              <InputField
                readOnly={true}
                label={fields[1].label}
                value={form[fields[1].key]}
                onChange={handleChange(fields[1].key)}
                error={errors[fields[1].key]}
                iconName={fields[1].iconName}
                prefix={fields[1].prefix}
                keyboardType={fields[1].keyboardType}
                maxLength={fields[1].maxLength}
                customRef={inputRefs.current[fields[1].key]}
              />
            </View>
          </ThemedView>
        </ScrollView>
        <Button
          isLoading={updateProfileLoading || fetchProfileLoading}
          wrapperStyle={{ marginTop: 10, marginBottom: 10 }}
          onPress={handleSave}
          title="Save Profile"
        />
        </DeferredFadeIn>
     
    
    </ScreenSafeWrapper>
  );
};

export default profile;

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
  profileImage: {
    height: 120,
    width: 120,
    borderRadius: 60,
    marginBottom: 15,
    alignSelf: "center",
  },
});
