import React, { lazy, Suspense } from "react";
import { StyleSheet, View, ViewStyle, ScrollView } from "react-native";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "@/constants/Colors";
import { router } from "expo-router";
import { setCheckoutFlow } from "@/redux/features/orderSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { useLogoutMutation } from "@/redux/features/authSlice";
import Feather from "@expo/vector-icons/Feather";
import CustomSuspense from "@/components/CustomSuspense";
// import AccountOption from "@/components/AccountOption";
// import ProfileContainer from "@/components/ProfileContainer";
const ProfileContainer = lazy(() => import("@/components/ProfileContainer"));
const AccountOption = lazy(() => import("@/components/AccountOption"));
const NotFound = lazy(() => import("../(result)/NotFound"));

const Account: React.FC = () => {
  const dispatch = useDispatch();
  const userInfo = useSelector((state: RootState) => state.auth.userData);
  const [logout, { isError: islogouterror, isSuccess }] = useLogoutMutation();
  console.log(userInfo);
  return (
    <ScreenSafeWrapper title="Profile">
      {userInfo?._id ? (
        <CustomSuspense>
          <Suspense fallback={null}>
            <ProfileContainer userInfo={userInfo} />
          </Suspense>

          <ScrollView style={{ flex: 1, marginTop: 30 }}>
            <View style={styles.optionsContainer}>
              <Suspense fallback={null}>
                <AccountOption
                  onPress={() => {
                    router.push("/profile");
                  }}
                  icon={
                    <MaterialCommunityIcons
                      name="account"
                      size={20}
                      color={Colors.light.gradientGreen_2}
                    />
                  }
                  label="My Profile"
                />
              </Suspense>
              <Suspense fallback={null}>
                <AccountOption
                  onPress={() => {
                    dispatch(setCheckoutFlow(false));
                    router.push("/(order)/order");
                  }}
                  icon={
                    <Feather
                      name="package"
                      size={20}
                      color={Colors.light.gradientGreen_2}
                    />
                  }
                  label="Orders"
                />
              </Suspense>
              <Suspense fallback={null}>
                <AccountOption
                  onPress={() => {
                    dispatch(setCheckoutFlow(false));
                    router.push("/(address)/addressList");
                  }}
                  icon={
                    <Ionicons
                      name="location-sharp"
                      size={20}
                      color={Colors.light.gradientGreen_2}
                    />
                  }
                  label="Saved Addresses"
                />
              </Suspense>
              {userInfo?.khataUrl == "NA" ? null : (
                <Suspense fallback={null}>
                  <AccountOption
                    onPress={async () => {
                      router.push("khata/56789");
                    }}
                    icon={
                      <MaterialIcons
                        name="manage-accounts"
                        size={20}
                        color={Colors.light.lightGreen}
                      />
                    }
                    label="Khata"
                  />
                </Suspense>
              )}
              <Suspense fallback={null}>
                <AccountOption
                  onPress={async () => {
                    await logout({})?.unwrap();
                  }}
                  icon={
                    <MaterialIcons
                      name="logout"
                      size={20}
                      color={Colors.light.gradientRed_1}
                    />
                  }
                  label="Logout"
                />
              </Suspense>
            </View>
          </ScrollView>
        </CustomSuspense>
      ) : (
        <Suspense fallback={null}>
          <NotFound
            title={"Logging Out..."}
            subtitle={"Please wait while we securely log you out."}
          />
        </Suspense>
      )}
    </ScreenSafeWrapper>
  );
};

export default Account;

const styles = StyleSheet.create({
  optionsContainer: {
    flex: 0.75,
    gap: 15,
    marginTop: 10,
  } as ViewStyle,
});
