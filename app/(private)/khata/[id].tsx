import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import React, { lazy, Suspense, useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import Khata from "@/components/Khata";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { RootState } from "@/types/global";
import { useSelector } from "react-redux";
import {
  useCheckKhataQuery,
  useLazyCheckKhataQuery,
} from "@/redux/features/khataSlice";
import { Colors } from "@/constants/Colors";
import {
  useLazyFetchProfileQuery,
  useUpdateProfileMutation,
} from "@/redux/features/authSlice";
const NotFound = lazy(() => import("../(result)/NotFound"));

const Page = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mobileNumber = useSelector(
    (state: RootState) => state?.auth?.userData?.mobileNumber
  );
  const [canGoBack, setCanGoBack] = useState(false);
  const _id = useSelector((state: RootState) => state?.auth?.userData?._id);
  const khataUrl = useSelector(
    (state: RootState) => state?.auth?.userData?.khataUrl
  );
  const [checkKhata, { isLoading: checkKhataLoading }] =
    useLazyCheckKhataQuery();
  const [updateProfile, { isLoading: updateProfileLoading }] =
    useUpdateProfileMutation();
  const [fetchProfile, { isLoading: fetchProfileLoading }] =
    useLazyFetchProfileQuery();
  const [localUrl, setLocalUrl] = useState("");

  //console.log(id);

  useEffect(() => {
    getFun(khataUrl);
  }, [khataUrl]);

  const getFun = async (khataUrl) => {
    try {
      if (khataUrl) {
        setLocalUrl(khataUrl);
      } else {
        const data = await checkKhata(
          { searchQuery: mobileNumber },
          false
        )?.unwrap();
       // console.log("uytfdcfvgbhj", data);
        if (data?.url) {
          const formRes = new FormData();
          formRes.append("khataUrl", data?.url);
          formRes.append("_id", _id);
          await updateProfile(formRes)?.unwrap();
          await fetchProfile({ _id: _id }, false)?.unwrap();
          setLocalUrl(data?.url);
        } else {
          const formRes = new FormData();
          formRes.append("khataUrl", "NA");
          formRes.append("_id", _id);
          await updateProfile(formRes)?.unwrap();
          await fetchProfile({ _id: _id }, false)?.unwrap();
        }
      }
    } catch (error) {
     // console.log(error);
    }
  };
  return (
    <ScreenSafeWrapper
      wrapperStyle={{ paddingHorizontal: 0 }}
      headerStyle={{ paddingHorizontal: 16 }}
      showBackButton={!canGoBack}
    >
      {localUrl == "" ||
      checkKhataLoading ||
      updateProfileLoading ||
      fetchProfileLoading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size={"large"} color={Colors.light.lightGreen} />
        </View>
      ) : localUrl !== "NA" ? (
        <Khata
          canGoBack={canGoBack}
          setCanGoBack={setCanGoBack}
          url={localUrl}
        />
      ) : (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Suspense fallback={null}>
            <NotFound
              title={"Feature Unavailable"}
              subtitle={
                "Sorry, this feature is currently not available for you."
              }
            />
          </Suspense>
        </View>
      )}
    </ScreenSafeWrapper>
  );
};

export default Page;

const styles = StyleSheet.create({});
