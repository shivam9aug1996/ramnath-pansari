import React, { lazy, Suspense, useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ViewStyle,
  ScrollView,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "@/constants/Colors";
import { router, useFocusEffect } from "expo-router";
import { setCheckoutFlow } from "@/redux/features/orderSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import {
  clearAuthData,
  useDeleteAccountMutation,
  useLogoutMutation,
} from "@/redux/features/authSlice";
import Feather from "@expo/vector-icons/Feather";
import CustomSuspense from "@/components/CustomSuspense";
import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import AccountOption from "@/components/AccountOption";
// import AccountOption from "@/components/AccountOption";
// import ProfileContainer from "@/components/ProfileContainer";
// const ProfileContainer = lazy(() => import("@/components/ProfileContainer"));
// const AccountOption = lazy(() => import("@/components/AccountOption"));
// const NotFound = lazy(() => import("../(result)/NotFound"));
import ProfileContainer from "@/components/ProfileContainer";
import NotFound from "../(result)/NotFound";
import useAccountStageLoad from "@/hooks/useAccountStageLoad";
import FadeSlideIn from "@/app/components/FadeSlideIn";
import DeferredFadeIn from "@/components/DeferredFadeIn";

const Account: React.FC = () => {
  const dispatch = useDispatch();
const clearAuthDataState = useSelector((state: RootState) => state?.auth?.clearAuthData);
console.log("clearAuthDataState456789099", clearAuthDataState);
  const userInfo = useSelector((state: RootState) => state.auth.userData);
  const [logout, { isError: islogouterror, isSuccess }] = useLogoutMutation();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [deleteAccount, { isLoading: isAccountDeleting }] =
    useDeleteAccountMutation();
  const [isAnimating, setIsAnimating] = useState(true);
 // console.log(userInfo);
  useFocusEffect(
    // Callback should be wrapped in `React.useCallback` to avoid running the effect too often.
    useCallback(() => {
      // Invoked whenever the route is focused.

      // Return function is invoked whenever the route gets out of focus.
      return () => {
      //  console.log("This route is now unfocused.");
        setDeleteConfirm(false);
        setLogoutConfirm(false);
      };
    }, [])
  );
  return (
    <>
      <ScreenSafeWrapper title="Profile">
       <DeferredFadeIn delay={100} style={{flex:1}}>
       {userInfo?._id ? (
          isAccountDeleting ? (
            <NotFound
              title={"Deleting Account..."}
              subtitle={"Please wait while we delete your account."}
            />
          ) : clearAuthDataState?.isLoading ? 
          <NotFound
              title={"Logging Out..."}
              subtitle={"Please wait while we securely log you out."}
            />
          :
          (
            <>
              
                <ProfileContainer userInfo={userInfo} animate={isAnimating} />
            

              <ScrollView
                bounces={Platform.OS === "android" ? false : true}
                style={{ flex: 1, marginTop: 10 }}
                contentContainerStyle={{ paddingBottom: 100 }}
                pinchGestureEnabled={false}
                showsVerticalScrollIndicator={false}
              >
                
                  <View style={styles.optionsContainer}>
                    {userInfo?.isGuestUser && (
                       <AccountOption
                       onPress={() => {
                         router.push("/login");
                       }}
                       icon={
                         <MaterialCommunityIcons
                           name="login"
                           size={20}
                           color={Colors.light.gradientGreen_2}
                         />
                       }
                       label="Login/Signup"
                     /> 
                    )}
                    
                    

                    {/* {userInfo?.khataUrl == "NA" ? null : (
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
                  )} */}

                   {!userInfo?.isGuestUser && (
                    <>
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
                     <AccountOption
                      onPress={() => {
                        setLogoutConfirm(true);
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

                    <AccountOption
                      onPress={async () => {
                        setDeleteConfirm(true);
                      }}
                      icon={
                        <MaterialIcons
                          name="delete-forever"
                          size={20}
                          color={Colors.light.gradientRed_1}
                        />
                      }
                      label="Delete Account"
                    />
                    </>
                   )}
                  </View>
                
              </ScrollView>
            </>
          )
        ) : (
          <NotFound
            title={"Logging Out..."}
            subtitle={"Please wait while we securely log you out."}
          />
        )}
       </DeferredFadeIn>
      </ScreenSafeWrapper>

      <>
        {deleteConfirm && (
          <BottomSheet
            onClose={() => {
              setDeleteConfirm(false);
            }}
            wrapperStyle={{ height: "100%" }}
          >
            <View style={styles.content}>
              <Text style={styles.title}>Confirm Deletion</Text>
              <Text style={styles.message}>
                Are you sure you want to delete your account? This action cannot
                be undone.
              </Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setDeleteConfirm(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={async () => {
                    setDeleteConfirm(false);
                    await deleteAccount({
                      userId: userInfo?._id,
                    })?.unwrap();
                    dispatch(clearAuthData());
                  }}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BottomSheet>
        )}
        {logoutConfirm && (
          <BottomSheet
            onClose={() => {
              setLogoutConfirm(false);
            }}
            wrapperStyle={{ height: "100%" }}
          >
            <View style={styles.content}>
              <Text style={styles.title}>Confirm Logout</Text>
              <Text style={styles.message}>
                Are you sure you want to log out of your account?
              </Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setLogoutConfirm(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={async () => {
                    setLogoutConfirm(false);
                    await logout({})?.unwrap();
                  }}
                >
                  <Text style={styles.deleteButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BottomSheet>
        )}
      </>
    </>
  );
};

export default Account;

const styles = StyleSheet.create({
  optionsContainer: {
    flex: 0.75,
    gap: 16,
    marginTop: 20,
    paddingHorizontal: 10,
    marginBottom: 24,
  } as ViewStyle,
  content: {
    backgroundColor: "#FFFFFF",
    padding: 28,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    flex: 1,
    marginTop: "6%",
  },
  title: {
    fontSize: 22,
    fontFamily: "Montserrat_800ExtraBold",
    marginBottom: 20,
    textAlign: "center",
    color: Colors.light.darkGrey,
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 16,
    fontFamily: "Raleway_500Medium",
    color: Colors.light.mediumGrey,
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.light.darkGrey,
    fontFamily: "Montserrat_700Bold",
    letterSpacing: 0.3,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: Colors.light.gradientRed_1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.light.gradientRed_1,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  deleteButtonText: {
    fontSize: 16,
    color: "white",
    fontFamily: "Montserrat_700Bold",
    letterSpacing: 0.3,
  },
});
