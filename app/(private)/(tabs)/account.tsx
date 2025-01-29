import React, { lazy, Suspense, useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ViewStyle,
  ScrollView,
  Text,
  TouchableOpacity,
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
// import AccountOption from "@/components/AccountOption";
// import ProfileContainer from "@/components/ProfileContainer";
const ProfileContainer = lazy(() => import("@/components/ProfileContainer"));
const AccountOption = lazy(() => import("@/components/AccountOption"));
const NotFound = lazy(() => import("../(result)/NotFound"));

const Account: React.FC = () => {
  const dispatch = useDispatch();
  const userInfo = useSelector((state: RootState) => state.auth.userData);
  const [logout, { isError: islogouterror, isSuccess }] = useLogoutMutation();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteAccount, { isLoading: isAccountDeleting }] =
    useDeleteAccountMutation();
  console.log(userInfo);
  useFocusEffect(
    // Callback should be wrapped in `React.useCallback` to avoid running the effect too often.
    useCallback(() => {
      // Invoked whenever the route is focused.

      // Return function is invoked whenever the route gets out of focus.
      return () => {
        console.log("This route is now unfocused.");
        setDeleteConfirm(false);
      };
    }, [])
  );
  return (
    <>
      <ScreenSafeWrapper title="Profile">
        {userInfo?._id ? (
          isAccountDeleting ? (
            <Suspense fallback={null}>
              <NotFound
                title={"Deleting Account..."}
                subtitle={"Please wait while we delete your account."}
              />
            </Suspense>
          ) : (
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
                  <Suspense fallback={null}>
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
                  </Suspense>
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
          )
        ) : (
          <Suspense fallback={null}>
            <NotFound
              title={"Logging Out..."}
              subtitle={"Please wait while we securely log you out."}
            />
          </Suspense>
        )}
      </ScreenSafeWrapper>
      {deleteConfirm && (
        <BottomSheet
          onClose={() => {
            setDeleteConfirm(false);
          }}
          wrapperStyle={{ height: "80%" }}
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
    </>
  );
};

export default Account;

const styles = StyleSheet.create({
  optionsContainer: {
    flex: 0.75,
    gap: 15,
    marginTop: 10,
  } as ViewStyle,
  content: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    flex: 1,
    marginTop: "5%",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#333",
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#ef3f3f",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
});
